import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import Image from "next/image";

const analyzeImage = async (imageElement) => {
  const model = await mobilenet.load();
  const predictions = await model.classify(imageElement);
  console.log(predictions);
  return predictions;
};

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setTimeout(() => {
          const imgElement = document.getElementById("uploaded-image");
          analyzeImage(imgElement).then((results) => console.log(results));
        }, 100); // Timeout to ensure the image is rendered before analysis
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <div>
          <h2>Uploaded Image:</h2>
          <Image
            id="uploaded-image"
            src={selectedImage}
            alt="Uploaded Preview"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
