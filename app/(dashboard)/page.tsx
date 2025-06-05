import { ChartAreaInteractive } from "@/components/charts/OverviewChart";
import { OverviewCard } from "@/components/OverviewCard";
import { auth, currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function Home() {
  const user = await currentUser();
  const { userId } = await auth();

  return (
    <div>
      <div className="flex flex-col space-y-4 p-5 ">
        <h1 className="font-semibold text-5xl">Welcome, {user?.firstName}!</h1>
        <OverviewCard userid={userId} />
        {/* // <ChartAreaInteractive /> */}
      </div>
    </div>
  );
}
