import Image from "next/image";
import Link from "next/link";

type PartnerLogoProps = {
  src: string;
  alt: string;
};

function PartnerLogoCell({ src, alt }: PartnerLogoProps) {
  return (
    <div className="relative aspect-square w-full border border-border bg-background">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-contain p-3 md:p-4"
      />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-border bg-background/90 backdrop-blur-sm">
      <div className="container-wide grid gap-8 py-10 md:grid-cols-2">
        <div className="space-y-2">
          <p className="font-black tracking-tight">AI Literacy Lab</p>
          <p className="text-sm text-muted-foreground">
            Warsztaty kompetencyjne ze sztucznej inteligencji dla studentów UJ.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>WZiKS UJ · Instytut Studiów Informacyjnych</p>
          <p>Koło Naukowe ZaintrygowanI UJ</p>
          <p>Licencja: CC BY-SA 4.0</p>
          <Link
            href="/o-projekcie"
            className="inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Informacje o finansowaniu
          </Link>
        </div>
      </div>
      <div className="container-wide border-t border-border py-6">
        <p className="mb-4 font-mono text-xs uppercase text-muted-foreground">Partnerzy projektu</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PartnerLogoCell src="/iduj.svg" alt="ID.UJ" />
          <PartnerLogoCell src="/isi.svg" alt="Instytut Studiów Informacyjnych UJ" />
          <PartnerLogoCell src="/knzi.svg" alt="Koło Naukowe ZaintrygowanI UJ" />
          <PartnerLogoCell src="/sendyka.dev.svg" alt="sendyka.dev" />
        </div>
      </div>
    </footer>
  );
}
