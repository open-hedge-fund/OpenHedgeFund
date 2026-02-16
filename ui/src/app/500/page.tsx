import ErrorPage from "@/components/ErrorPage";

export default function InternalServerError() {
  return (
    <ErrorPage
      code="500"
      title="Internal Server Error"
      description="Something went wrong on our end. Please try again later."
    />
  );
}
