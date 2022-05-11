import MainLayout from "~/layouts/MainLayout";
import PageLayout from "~/layouts/PageLayout";

const SwapPage = () => {
  return (
    <MainLayout title="Swap">
      <PageLayout breadcrumbs={["/ Swap"]}>Swap Page</PageLayout>
    </MainLayout>
  );
};

export default SwapPage;
