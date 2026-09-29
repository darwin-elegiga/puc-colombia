/** Rueda y texto para un botón con su acción en marcha. */
export default function Cargando({ texto }: { texto: string }) {
  return (
    <span role="status" data-cargando className="inline-flex items-center justify-center gap-2">
      <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden />
      {texto}
    </span>
  )
}
