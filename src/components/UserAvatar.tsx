
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";

interface UserAvatarProps {
  user: User | null;
  className?: string;
}

const UserAvatar = ({ user, className }: UserAvatarProps) => {
  const getFallbackInitials = () => {
    if (!user?.email) return "?";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.user_metadata?.avatar_url} />
      <AvatarFallback>{getFallbackInitials()}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
