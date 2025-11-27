import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Extension Firefox</CardTitle>
        <CardDescription>
          Installez l&apos;extension obligatoire pour accéder à Ecole Tres Directe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/etd-unblock">Installer l&apos;extension</Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Remplir Appréciations</CardTitle>
        <CardDescription>
          Générez et remplissez automatiquement les appréciations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant="outline">
          <Link href="/remplir-appreciations">
            Remplir les appréciations
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>
          Partagez vos retours et suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant="outline">
          <Link href="/feedback">Donner mon avis</Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à Ecole Tres Directe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant="outline">
          <Link href="/login">Connexion</Link>
        </Button>
      </CardContent>
    </Card> 
    </div>
  );
}