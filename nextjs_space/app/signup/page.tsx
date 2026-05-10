import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import SignupForm from './_components/signup-form';

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');
  return <SignupForm />;
}
