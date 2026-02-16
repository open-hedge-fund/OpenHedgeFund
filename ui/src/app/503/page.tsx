import ErrorPage from "@/components/ErrorPage";

export default function ServiceUnavailable() {
  return (
    <ErrorPage
      code="503"
      title="Service Unavailable"
      description="We're currently performing maintenance. Please check back soon."
    />
  );
}
