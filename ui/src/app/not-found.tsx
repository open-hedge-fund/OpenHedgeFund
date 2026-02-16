import ErrorPage from "@/components/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Page Not Found"
      description="We can't seem to find the page you are looking for!"
    />
  );
}
