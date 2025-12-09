import { authClient } from '@/lib/auth-client';

const useAuth = () => {
  const { data, isPending } = authClient.useSession();
  console.log('data', data);

  const signIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
    });
  };

  const signOut = async () => {
    await authClient.signOut();
  };

  return { signIn, signOut, user: data?.user, session: data?.session, isPending };
};

export default useAuth;
