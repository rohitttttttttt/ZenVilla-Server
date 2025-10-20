import multer from 'multer';


const storage = multer.memoryStorage();


const upload = multer({ storage });


export const fileHandler = (fileName, type = "single", maxCount = 5) => {
    if (type === "single") {
        return upload.single(fileName);
    } else if (type === "multiple") {
        return upload.array(fileName, maxCount);
    } else {
        return upload.any();
    }
};