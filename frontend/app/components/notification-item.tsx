import Link from "next/link";
import styles from "./notification-item.module.css";

type NotificationItemProps = {
  message: string;
  iconUrl?: string | null;
  postUrl?: string | null;
  postPreview?: string | null;
  postImageUrl?: string | null;
  isRead?: boolean;
  date?: string;
};

export default function NotificationItem({
  message,
  iconUrl = null,
  postUrl = null,
  postPreview = null,
  postImageUrl = null,
  isRead = true,
  date,
}: NotificationItemProps) {
  const content = (
    <>
      <div className={styles.userIcon} aria-hidden="true">
        {iconUrl && <img src={iconUrl} alt="" />}
      </div>
      <div className={styles.notificationCopy}>
        <span className={styles.notificationMessage}>{message}</span>
        {postPreview && <span className={styles.postPreview}>{postPreview}</span>}
        {date && <time className={styles.notificationDate}>{date}</time>}
      </div>
      {postImageUrl && (
        <img className={styles.postThumbnail} src={postImageUrl} alt="" loading="lazy" decoding="async" />
      )}
    </>
  );
  const className = `${styles.notificationItem} ${isRead ? "" : styles.unread}`;

  return postUrl ? (
    <Link
      href={postUrl}
      className={className}
      aria-label={`${message}${postPreview ? ` 元の投稿: ${postPreview}` : ""} 投稿を開く`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
