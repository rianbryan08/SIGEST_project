import { useEffect, useState } from "react";
import { api } from "../services/api";

interface AttachmentImageProps {
  ticketId: string;
  attachmentId: string;
  filename: string;
}

// As imagens ficam protegidas no servidor: buscamos com o token do usuário e exibimos localmente.
export function AttachmentImage({ ticketId, attachmentId, filename }: AttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    api
      .get(`/tickets/${ticketId}/attachments/${attachmentId}`, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ticketId, attachmentId]);

  if (failed) return <p className="text-sm text-muted">Não foi possível carregar a imagem anexada.</p>;
  if (!src) return <p className="text-sm text-muted">Carregando imagem...</p>;

  return (
    <a href={src} target="_blank" rel="noreferrer" title="Abrir em tamanho original">
      <img src={src} alt={filename} className="max-h-72 rounded-md border border-line object-contain" />
    </a>
  );
}
