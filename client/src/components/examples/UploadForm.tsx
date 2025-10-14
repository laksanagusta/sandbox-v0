import UploadForm from '../UploadForm';

export default function UploadFormExample() {
  const handleUploaded = (data: any[]) => {
    console.log('Uploaded data:', data);
  };

  return <UploadForm onUploaded={handleUploaded} />;
}
