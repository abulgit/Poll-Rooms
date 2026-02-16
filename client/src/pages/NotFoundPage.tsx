import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-base">
            The page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
