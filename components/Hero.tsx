import Image from "next/image";

export function Hero() {
  return (
    <section className="space-y-5 text-center">
      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <Image
          src="/brand/logo-light-transparent.png"
          alt="Manualfor.life logo"
          width={465}
          height={198}
          className="h-auto w-full"
          priority
        />
      </div>
      <p className="mx-auto max-w-2xl text-base leading-relaxed text-(--theme-muted) transition-colors duration-400 sm:text-lg">
        This is a place where people leave one thought that changed their life.
        <br />
        Write yours - for someone you will never meet.
      </p>
    </section>
  );
}
