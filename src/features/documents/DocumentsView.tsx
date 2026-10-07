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
  FileUp
} from 'lucide-react'
import { FinancialDocument, FinancialRecord, UserRole } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

interface DocumentsViewProps {
  documents: FinancialDocument[]
  records: FinancialRecord[]
  userRole: UserRole
}

export function DocumentsView({ documents, records, userRole }: DocumentsViewProps) {
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
      setTimeout(() => {
        setIsUploadOpen(false)
        setUploadSuccess(false)
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
            Financial Documents & Receipts
          </h1>
          <p className="text-xs text-[#71857a] mt-0.5">
            Encrypted, permission-controlled storage for receipts, vendor invoices, and vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Receipt</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Archived Documents
          </span>
          <p className="text-2xl font-serif font-semibold text-[#1e382d]">
            {documents.length} Files
          </p>
          <span className="text-[11px] text-[#6d8076] mt-1 block">
            Audited financial attachments
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Storage Footprint
          </span>
          <p className="text-2xl font-serif font-semibold text-[#1e382d]">
            {totalSize}
          </p>
          <span className="text-[11px] text-[#6d8076] mt-1 block">
            Encrypted secure local storage
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Linked Transactions
          </span>
          <p className="text-2xl font-serif font-semibold text-[#30644d]">
            {documents.filter((d) => d.recordId).length} Linked
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Verified proof of payment
          </span>
        </Card>
      </div>

      {/* Filter and Document Grid */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f0f4f1] text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              All Files ({documents.length})
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'pdf'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              PDFs
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'image'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              Images
            </button>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#889a90] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3e6b57]"
            />
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isPdf = doc.mimeType === 'application/pdf'
            const sizeKb = (doc.sizeBytes / 1024).toFixed(0) + ' KB'

            return (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-[#e4eae5] bg-white hover:border-[#83a993] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPdf ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#1e382d] truncate">
                          {doc.originalName}
                        </h4>
                        <span className="text-[10px] text-[#788a80]">
                          {sizeKb} • {formatDate(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-[#697d72] line-clamp-2 mb-3 bg-[#fafcfa] p-2 rounded-xl border border-[#eef3f0]">
                      {doc.notes}
                    </p>
                  )}

                  {doc.recordDescription && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#416151] font-medium mb-3">
                      <WalletCards className="w-3.5 h-3.5 text-[#6c8e7e]" />
                      <span className="truncate">{doc.recordDescription}</span>
                      {doc.recordAmount && (
                        <span className="font-semibold shrink-0">
                          ({formatCurrency(doc.recordAmount)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f0f4f1] flex items-center justify-between">
                  <span className="text-[10px] text-[#84958c]">
                    By: {doc.uploadedByName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-[#55695e] hover:bg-[#eef4f0] transition-colors"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/documents/${doc.id}`}
                      download={doc.originalName}
                      className="p-1.5 rounded-lg text-[#55695e] hover:bg-[#eef4f0] transition-colors"
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
      </Card>

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
            <div className="p-4 rounded-2xl bg-[#fafcfa] border border-[#e2eae4] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#788a80] block text-[11px]">Associated Record</span>
                <strong className="text-[#203a30] font-semibold">
                  {previewDoc.recordDescription || 'General financial attachment'}
                </strong>
              </div>
              {previewDoc.recordAmount && (
                <div className="text-right">
                  <span className="text-[#788a80] block text-[11px]">Amount</span>
                  <strong className="text-[#2f5c49] font-bold">
                    {formatCurrency(previewDoc.recordAmount)}
                  </strong>
                </div>
              )}
            </div>

            {previewDoc.notes && (
              <div className="text-xs text-[#52665b] bg-[#f2f6f4] p-3 rounded-xl border border-[#e1e9e3]">
                <strong>Notes:</strong> {previewDoc.notes}
              </div>
            )}

            <div className="py-6 text-center border border-dashed border-[#dce6df] rounded-2xl bg-[#f7f9f7]">
              {previewDoc.mimeType.startsWith('image/') ? (
                <div className="space-y-3">
                  <ImageIcon className="w-12 h-12 text-[#688a79] mx-auto opacity-70" />
                  <p className="text-xs text-[#6e8277]">Secure Receipt Image Preview</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-rose-600 mx-auto opacity-70" />
                  <p className="text-xs text-[#6e8277]">Secure PDF Financial Voucher</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={`/api/documents/${previewDoc.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Open / Download Full File</span>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Financial Document"
        description="Attach receipt images, invoices, or bank proof of payment."
        maxWidth="md"
      >
        {uploadSuccess ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-serif text-[#1e382d]">Document Uploaded</h4>
            <p className="text-xs text-[#6e8277] mt-1">The receipt has been encrypted and saved.</p>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {uploadError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#52665c] uppercase tracking-wider mb-1.5">
                Select File (PDF, JPEG, PNG, max 5MB)
              </label>
              <input
                type="file"
                name="file"
                required
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="w-full text-xs text-[#4c6357] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#e4efe6] file:text-[#2c5b48] hover:file:bg-[#d5e7d9] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52665c] uppercase tracking-wider mb-1.5">
                Link to Financial Record (Optional)
              </label>
              <select
                name="recordId"
                className="w-full px-3 py-2 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30]"
              >
                <option value="">None / Standalone Document</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.description} ({formatCurrency(r.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52665c] uppercase tracking-wider mb-1.5">
                Notes / Explanation
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g. Bus transit receipt for Sunday choir rehearsal"
                className="w-full px-3 py-2 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#dce5df] bg-white text-[#5b6e64] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Save Document'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

