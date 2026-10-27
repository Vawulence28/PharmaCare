/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Optional: uncomment if deploying under a subpath, otherwise leave default
  // basePath: '',
};

export default function nextConfigWrapper(phase, { defaultConfig }) {
  return nextConfig;
}