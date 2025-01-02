import React, { useState, Suspense } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

export default function InvoiceModal({ open, setOpen, invoiceData }) {
  const [isClient, setIsClient] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleError = (error) => {
    console.error('PDF Error:', error);
    setPdfError(error.message);
  };

  if (!invoiceData) return null;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-5xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Facture #{invoiceData?.tracking_number}
                    </Dialog.Title>

                    {pdfError ? (
                      <div className="p-4 text-red-500">
                        Une erreur est survenue lors du chargement du PDF. Veuillez télécharger la facture.
                      </div>
                    ) : (
                      <div className="mt-4 bg-white shadow-sm rounded-lg">
                        <div className="h-[calc(100vh-300px)] w-full">
                          {isClient ? (
                            <Suspense fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                              </div>
                            }>
                              <PDFViewer 
                                className="w-full h-full border-0" 
                                showToolbar={false}
                                onError={handleError}
                              >
                                <InvoicePDF data={invoiceData} />
                              </PDFViewer>
                            </Suspense>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg mt-4">
                      {isClient && (
                        <PDFDownloadLink
                          document={<InvoicePDF data={invoiceData} />}
                          fileName={`facture_${invoiceData?.tracking_number}.pdf`}
                          className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          {({ blob, url, loading, error }) =>
                            loading ? 'Génération du PDF...' : 'Télécharger la facture'
                          }
                        </PDFDownloadLink>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
