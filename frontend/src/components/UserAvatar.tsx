interface UserAvatarProps {
  displayName: string;
  avatarUrl?: string;
  size?: number;
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
];

export default function UserAvatar({ displayName, avatarUrl, size = 32 }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const letter = (displayName || '?')[0].toUpperCase();
  const colorIndex = displayName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;

  return (
    <div
      className={`${COLORS[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {letter}
    </div>
  );
}
