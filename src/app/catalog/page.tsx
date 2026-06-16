// /catalog is an alias for the root catalog page.
// Redirect to / to keep a single canonical URL.
import { redirect } from 'next/navigation'

export default function CatalogRedirect() {
  redirect('/')
}
