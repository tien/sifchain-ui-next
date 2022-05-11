import { NextPage } from "next";
import MainLayout from "~/layouts/MainLayout";
import PageLayout from "~/layouts/PageLayout";

const AssetsPage: NextPage = () => {
  return (
    <MainLayout title="Balances">
      <PageLayout breadcrumbs={["/ Balances"]}>Balances Page</PageLayout>
    </MainLayout>
  );
};

export default AssetsPage;
