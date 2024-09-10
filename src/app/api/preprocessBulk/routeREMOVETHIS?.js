// import { preprocessDataset } from "../../model/prepareDataset/utilities/preProcessImg";
// import fs from "fs";
// import path from "path";

// export async function POST(req) {
//   try {
//     // Extract the array of image paths from the request body
//     const { imagePaths } = await req.json();

//     // Load metadata.json (which contains contrast info)
//     const metadataPath = path.resolve(process.cwd(), "data", "metadata.json");
//     const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

//     // Preprocess the dataset
//     const processedData = await preprocessDataset(imagePaths, metadata);

//     return new Response(JSON.stringify({ processedData }), { status: 200 });
//   } catch (error) {
//     console.error("Error during dataset preprocessing:", error);
//     return new Response(
//       JSON.stringify({ error: "Dataset preprocessing failed" }),
//       { status: 500 }
//     );
//   }
// }
