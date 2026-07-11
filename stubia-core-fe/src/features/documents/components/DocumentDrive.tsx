import React, { useEffect, useState } from 'react';
import { Document, DocumentAccessLog } from '../types/documents.types';
import { documentsApi } from '../api/documentsApi';
import { DataTable } from '../../../components/shared/DataTable';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import { Badge } from '../../../components/shared/Badge';
import { useAuthStore } from '../../../store/authStore';
import { Folder, FileText, Upload, Lock, History, Eye, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DocumentDrive: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeFolder, setActiveFolder] = useState<'SOP' | 'Internal' | 'Legal' | 'Kontrak'>('SOP');
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Audit state
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<DocumentAccessLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const role = user?.role || '';
  const isSuperAdmin = role === 'super_admin';

  // Folders definitions and lock requirements
  const folders = [
    { name: 'SOP', label: 'SOP Operasional', allowedRoles: ['*'] },
    { name: 'Internal', label: 'Dokumen Internal', allowedRoles: ['*'] },
    { name: 'Legal', label: 'Berkas Hukum / Legal', allowedRoles: ['super_admin', 'academic_manager', 'hr_ops', 'finance_officer'] },
    { name: 'Kontrak', label: 'Kontrak & MoU', allowedRoles: ['super_admin', 'hr_ops', 'finance_officer'] },
  ];

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.getDocuments(activeFolder);
      setDocuments(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat dokumen drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeFolder]);

  const handleFolderClick = (folderName: any, allowedRoles: string[]) => {
    if (allowedRoles[0] === '*' || allowedRoles.includes(role)) {
      setActiveFolder(folderName);
    } else {
      toast.error(`Akses ditolak: Folder ${folderName} terkunci.`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !selectedFile) {
      toast.error('Silakan isi nama dokumen dan pilih berkas.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Membaca berkas dan mengonversi base64...');

    try {
      const reader = new FileReader();
      
      // Async convert to base64
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await fileDataPromise;

      await documentsApi.uploadDocument({
        name: uploadName,
        folderPath: activeFolder,
        filename: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64Data,
      });

      toast.success('Dokumen berhasil diunggah!', { id: toastId });
      setIsUploadOpen(false);
      setUploadName('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah berkas.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAccess = async (doc: Document, action: 'view' | 'download') => {
    try {
      // 1. Log access
      await documentsApi.logDocumentAccess(doc.id, action);
      
      // 2. Open or download file
      window.open(doc.fileUrl, '_blank');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await documentsApi.deleteDocument(doc.id);
      toast.success('Dokumen berhasil dihapus!');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus dokumen.');
    }
  };

  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    setIsAuditOpen(true);
    try {
      const logs = await documentsApi.getDocumentAccessLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat log audit.');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const isFolderLocked = (allowedRoles: string[]) => {
    return allowedRoles[0] !== '*' && !allowedRoles.includes(role);
  };

  const columns = [
    {
      header: 'Nama Dokumen',
      accessor: 'name',
      className: 'w-[40%]',
      render: (val: string, row: Document) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-[#1B3FAB] shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#0F172A]">{val}</p>
            <p className="text-[10px] text-[#64748B] font-semibold">Tipe: {row.fileType}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Versi',
      accessor: 'version',
      className: 'w-[10%]',
      render: (val: number) => (
        <Badge variant="InProgress">v{val}</Badge>
      ),
    },
    {
      header: 'Diupload Oleh',
      accessor: 'uploadedBy',
      className: 'w-[20%]',
      render: (_: any, row: Document) => (
        <span className="text-[10px] font-bold text-slate-700">{row.uploadedBy?.name || '-'}</span>
      ),
    },
    {
      header: 'Tanggal Upload',
      accessor: 'createdAt',
      className: 'w-[15%]',
      render: (val: string) => (
        <span className="text-[10px] text-[#64748B] font-semibold">
          {new Date(val).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Aksi',
      className: 'w-[20%] text-center',
      render: (_: any, row: Document) => {
        const canDelete = isSuperAdmin || row.uploadedById === user?.id;
        return (
          <div className="flex justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAccess(row, 'view')}
              className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 focus:outline-none"
              title="Pratinjau Berkas"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAccess(row, 'download')}
              className="h-8 w-8 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] flex items-center justify-center text-[#1B3FAB] focus:outline-none"
              title="Unduh Berkas"
            >
              <Download className="h-4 w-4" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(row)}
                className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 focus:outline-none"
                title="Hapus Dokumen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const auditColumns = [
    {
      header: 'PIC',
      accessor: 'user',
      className: 'w-[25%]',
      render: (_: any, row: DocumentAccessLog) => (
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-[#0F172A]">{row.user?.name || '-'}</p>
          <p className="text-[9px] text-[#64748B] font-bold">{row.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Dokumen',
      accessor: 'document',
      className: 'w-[40%]',
      render: (_: any, row: DocumentAccessLog) => (
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-[#0F172A]">{row.document?.name || '-'}</p>
          <p className="text-[9px] text-slate-500 font-semibold">{row.document?.folderPath}</p>
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'action',
      className: 'w-[15%]',
      render: (val: string) => (
        <Badge variant={val === 'download' ? 'Done' : 'InProgress'}>
          {val.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Waktu Akses',
      accessor: 'accessedAt',
      className: 'w-[20%]',
      render: (val: string) => (
        <span className="text-[10px] text-[#64748B] font-bold">
          {new Date(val).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* File management controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-[#1B3FAB]" />
          <h3 className="text-base font-bold text-[#0F172A]">Secure Document Drive</h3>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAuditLogs}
              className="text-xs font-bold border-[#CBD5E1] hover:bg-slate-100"
            >
              <History className="h-4.5 w-4.5 mr-1.5 text-slate-600" /> Audit Access Logs
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs font-bold"
          >
            <Upload className="h-4.5 w-4.5 mr-1.5" /> Upload Dokumen
          </Button>
        </div>
      </div>

      {/* Folders grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {folders.map((folder) => {
          const locked = isFolderLocked(folder.allowedRoles);
          const isActive = activeFolder === folder.name;

          return (
            <button
              key={folder.name}
              type="button"
              onClick={() => handleFolderClick(folder.name, folder.allowedRoles)}
              className={`border rounded-2xl p-4 flex items-center justify-between text-left transition-all ${
                isActive
                  ? 'border-[#1B3FAB] bg-blue-50/20 text-[#1B3FAB]'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1.5">
                <Folder className={`h-6 w-6 ${isActive ? 'text-[#1B3FAB]' : 'text-slate-400'}`} />
                <p className="text-xs font-extrabold">{folder.label}</p>
              </div>

              {locked && (
                <Lock className="h-4 w-4 text-red-500 shrink-0 self-start" />
              )}
            </button>
          );
        })}
      </div>

      {/* Datatable */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5">
          <Folder className="h-4 w-4 text-[#1B3FAB]" />
          <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Folder: {activeFolder}
          </h4>
        </div>

        <DataTable
          columns={columns}
          data={documents}
          isLoading={isLoading}
          emptyMessage={`Tidak ada berkas di dalam folder ${activeFolder}.`}
        />
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={`Upload Dokumen ke Folder ${activeFolder}`}>
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
          <Input
            label="Nama Ringkasan Dokumen (e.g. SOP Penulisan Soal PM)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g. SOP Content Writing UTBK"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Pilih Berkas File</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs font-semibold text-[#0F172A] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-[#1B3FAB] hover:file:bg-slate-200 cursor-pointer"
              required
            />
            <p className="text-[10px] text-[#64748B] mt-1 font-medium">Batas maksimal ukuran file: 5MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#CBD5E1]/40 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUploadOpen(false)}
              className="text-xs font-bold border-[#CBD5E1]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUploading}
              className="text-xs font-bold bg-[#1B3FAB] hover:bg-[#15328A] text-white"
            >
              Unggah Berkas
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Logs Modal */}
      <Modal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} title="Audit Logs Akses Dokumen">
        <div className="space-y-4 max-h-[480px] overflow-y-auto">
          <DataTable
            columns={auditColumns}
            data={auditLogs}
            isLoading={isAuditLoading}
            emptyMessage="Belum ada catatan log aktivitas akses."
          />
        </div>
      </Modal>
    </div>
  );
};
export default DocumentDrive;
