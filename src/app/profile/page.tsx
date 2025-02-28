import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: {
    id: string;
  };
}) {
  if (!searchParams?.id) {
    return redirect("/");
  }
  // const { data, error } = await supabase
  //   .from("poll")
  //   .select("*")
  //   .eq("created_by", searchParams.id)
  //       .order("created_at", { ascending: false });
  // if (error) {
  //   throw new Error(error.message);
  // }
  // return <UserPollsTable userPolls={data} />;
  return null;
}
