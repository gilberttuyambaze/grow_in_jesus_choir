'use client'

import * as React from 'react'
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Upload,
  Download,
  Eye,
  Search,
  CheckCircle2,
  Calendar,
  WalletCards,
  X,
  FileUp,
  FolderLock,
  Sparkles
} from 'lucide-react'
import { FinancialDocument, FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface DocumentsViewProps {
  documents: FinancialDocument[]
  records: FinancialRecord[]
  userRole: UserRole
}

export function DocumentsView({ documents, records, userRole }: DocumentsViewProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()

  const [filterType, setFilterType] = React.useState<'all' | 'image' | 'pdf'>('all')
  const [search, setSearch] = React.useState('')
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [previewDoc, setPreviewDoc] = React.useState<FinancialDocument | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = React.useState(false)

  const filteredDocs = React.useMemo(() => {
    return documents.filter((d) => {
      if (filterType === 'image' && !d.mimeType.startsWith('image/')) return false
      if (filterType === 'pdf' && d.mimeType !== 'application/pdf') return false

      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = d.originalName.toLowerCase().includes(query)
        const matchNotes = d.notes?.toLowerCase().includes(query)
        const matchRecord = d.recordDescription?.toLowerCase().includes(query)
        if (!matchName && !matchNotes && !matchRecord) return false
      }

      return true
    })
  }, [documents, filterType, search])

  const totalSize = React.useMemo(() => {
    const bytes = documents.reduce((sum, d) => sum + d.sizeBytes, 0)
    return (bytes / 1024).toFixed(1) + ' KB'
  }, [documents])

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadSuccess(true)
      showToastSuccess('Document Uploaded', 'Receipt successfully saved to private vault.')
      setTimeout(() => {
        setIsUploadOpen(false)
        setUploadSuccess(false)
        window.location.reload()
      }, 1200)
    } catch (err: any) {
      setUploadError(err.message)
      showToastError('Upload Failed', err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Financial Documents & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Private, permission-controlled storage for invoices, payment receipts, and vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>+ Upload Receipt</span>
        </button>
      </div>

      {/* Metric Cards matching Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-surface p-6 bg-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Archived Documents
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {documents.length} Files
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Audited financial attachments
          </span>
        </div>

        <div className="card-surface p-6 bg-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Storage Footprint
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {totalSize}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Protected private storage (outside public/)
          </span>
        </div>

        <div className="card-surface p-6 bg-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Linked Transactions
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-700 font-sans tracking-tight">
            {documents.filter((d) => d.recordId).length} Linked
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified proof of payment
          </span>
        </div>
      </div>

      {/* Filter and Document Grid */}
      <div className="card-surface p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100/80 text-xs font-medium w-fit">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Files ({documents.length})
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-4 py-2 rounded-xl transition-all ${
                filterType === 'pdf'
                  ? 'bg-white text-rose-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              PDFs
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-4 py-2 rounded-xl transition-all ${
                filterType === 'image'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Images
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search filename, notes, record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isPdf = doc.mimeType === 'application/pdf'
            const sizeKb = (doc.sizeBytes / 1024).toFixed(0) + ' KB'

            return (
              <div
                key={doc.id}
                className="p-4 rounded-3xl border border-slate-150 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isPdf ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {doc.originalName}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {sizeKb} • {formatDate(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      {doc.notes}
                    </p>
                  )}

                  {doc.recordDescription && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium mb-3">
                      <WalletCards className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">{doc.recordDescription}</span>
                      {doc.recordAmount && (
                        <span className="font-bold text-slate-900 shrink-0">
                          ({formatCurrency(doc.recordAmount)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    By: {doc.uploadedByName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/documents/${doc.id}`}
                      download={doc.originalName}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.originalName}
          description={`Uploaded by ${previewDoc.uploadedByName} on ${formatDate(previewDoc.createdAt)}`}
          maxWidth="lg"
        >
          <div className="py-2 space-y-4">
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Associated Record</span>
                <strong className="text-slate-900 font-bold">
                  {previewDoc.recordDescription || 'General financial attachment'}
                </strong>
              </div>
              {previewDoc.recordAmount && (
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Amount</span>
                  <strong className="text-indigo-700 font-bold font-sans">
                    {formatCurrency(previewDoc.recordAmount)}
                  </strong>
                </div>
              )}
            </div>

            {/* In-browser preview */}
            <div className="rounded-3xl border border-slate-200 bg-slate-100 p-2 min-h-[300px] flex items-center justify-center overflow-hidden">
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={`/api/documents/${previewDoc.id}`}
                  alt={previewDoc.originalName}
                  className="max-h-[460px] w-auto object-contain rounded-2xl shadow-sm"
                />
              ) : previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={`/api/documents/${previewDoc.id}`}
                  className="w-full h-[460px] rounded-2xl border-0"
                  title="PDF preview"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">
                    Preview is not supported for this file format.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={`/api/documents/${previewDoc.id}`}
                download={previewDoc.originalName}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* UPLOAD RECEIPT MODAL */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Financial Document"
          description="Attach a receipt, payment proof, or invoice to choir records."
          maxWidth="md"
        >
          {uploadSuccess ? (
            <div className="py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Document Uploaded
              </h3>
              <p className="text-xs text-slate-500">
                Receipt saved securely in private storage.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
              {uploadError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Document File (Max 5 MB) *
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Link to Financial Record (Optional)
                </label>
                <select
                  name="recordId"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Do not link to a specific record</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {formatDate(r.recordDate)}: {r.description} ({formatCurrency(r.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes / Vendor Description (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Paid in cash at Kigali Music store"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
