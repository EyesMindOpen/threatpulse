import ThreatDetail from './_components/threat-detail';

export default function ThreatDetailPage({ params }: { params: { id: string } }) {
  return <ThreatDetail id={params?.id ?? ''} />;
}
