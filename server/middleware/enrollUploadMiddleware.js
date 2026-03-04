import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadFields = upload.fields([
  { name: "studentImage", maxCount: 1 },
  { name: "bookImage", maxCount: 1 },
  { name: "tutorPicture", maxCount: 1 }, 
  { name: "qrImage", maxCount: 1 }  
]);

export const uploadSingle = upload.single("courseImg");