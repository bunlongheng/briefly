// Regenerate public/books.json from the local sqlite DB (the Vercel fallback).
// Run after adding/removing books, then commit public/books.json + public/audio.
import { writeManifest } from "../lib/manifest";

writeManifest();
console.log("wrote public/books.json");
