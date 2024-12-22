import { useState } from 'react'
import CreateParcel from './CreateParcel'
import ParcelsList from './ParcelsList'

export default function Parcels() {
  return (
    <div>
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <ParcelsList />
          </div>
        </div>
      </div>
    </div>
  )
}
