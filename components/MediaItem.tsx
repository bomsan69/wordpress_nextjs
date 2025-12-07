import { WPMedia } from "@/types/wordpress";
import { MediaDeleteButton } from "./MediaDeleteButton";
import Image from "next/image";

interface MediaItemProps {
  media: WPMedia;
}

export function MediaItem({ media }: MediaItemProps) {
  const thumbnailUrl =
    media.media_details?.sizes?.thumbnail?.source_url ||
    media.media_details?.sizes?.medium?.source_url ||
    media.source_url;

  const title = media.title.rendered || "제목 없음";

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={thumbnailUrl}
          alt={media.alt_text || title}
          fill
          className="object-fit"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-senior-base font-medium text-gray-900 truncate mb-3">
          {title}
        </h3>
        <MediaDeleteButton mediaId={media.id} mediaTitle={title} />
      </div>
    </div>
  );
}
