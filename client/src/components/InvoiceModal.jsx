import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/react/24/outline/index.js';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import InvoicePDF from './InvoicePDF';
import InvoicePreview from './InvoicePreview';

export default function InvoiceModal({ open, setOpen, invoiceData }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const supabase = useSupabaseClient();

  if (!invoiceData) return null;

  const handleShare = async () => {
    try {
      setIsGeneratingLink(true);
      
      // Générer le PDF
      const pdfBlob = await new Promise((resolve) => {
        const doc = new jsPDF();
        doc.html(document.querySelector("#invoice-preview"), {
          callback: (doc) => {
            resolve(doc.output('blob'));
          },
        });
      });

      // Upload vers Supabase Storage
      const fileName = `factures/facture_${invoiceData.tracking_number}_${Date.now()}.pdf`;
      const { data, error } = await supabase
        .storage
        .from('public')
        .upload(fileName, pdfBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf'
        });

      if (error) throw error;

      // Générer l'URL publique
      const { data: { publicUrl } } = supabase
        .storage
        .from('public')
        .getPublicUrl(fileName);

      // Copier le lien dans le presse-papiers
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Lien de partage copié dans le presse-papiers !');
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast.error('Erreur lors de la génération du lien de partage');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-5xl">
                {/* Header */}
                <div className="bg-white px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Facture #{invoiceData?.tracking_number}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-5 sm:p-6">
                  <div id="invoice-preview" className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <InvoicePreview data={invoiceData} />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-3">
                  <PDFDownloadLink
                    document={<InvoicePDF data={invoiceData} />}
                    fileName={`facture_${invoiceData?.tracking_number}.pdf`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {({ loading }) => (
                      <>
                        <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
                        {loading ? 'Génération du PDF...' : 'Télécharger'}
                      </>
                    )}
                  </PDFDownloadLink>

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isGeneratingLink}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShareIcon className="mr-2 h-5 w-5" />
                    {isGeneratingLink ? 'Génération du lien...' : 'Partager'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
