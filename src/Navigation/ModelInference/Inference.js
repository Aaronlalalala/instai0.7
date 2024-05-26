import { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { Navbar, Nav, Card, Container, Row, Col, Button, Form } from "react-bootstrap";
import InstAI_icon from "../../image/iconnew.png";
import axios from "axios";
import { BounceLoader } from 'react-spinners';
import './Inference.css';
import FinishedInference from "../../image/FinishedInferencing.jpg";


function Inference() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("uploading")
    const userid = localStorage.getItem("userId");
    const projectname = searchParams.get('projectname');
    const [modelsInfo, setModelInfo] = useState();
    const [currentModel, setCurrentModel] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [feedbackInfo, setFeedbackInfo] = useState('');
    const [imageURL, setImageURL] = useState([]);
    const [annotationInfo, setAnnotationInfo] = useState([]);
    const [currentImgCount, setCurrentImg] = useState(1);
    const FeedbackModify = process.env.REACT_APP_FEEDBACK_MODIFY;
    const InferenceToken = process.env.REACT_APP_INFERENCE_TOKEN;
    const InferenceGetModels = process.env.REACT_APP_INFERENCE_GETMODELS;
    const RemoteInference = process.env.REACT_APP_REMOTE_INFERENCE;
    const Upload = process.env.REACT_APP_UPLOAD;
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);


    const fetchModels = async () => {

        try {
            const formData = new FormData();
            formData.append('access_token', InferenceToken);
            formData.append('Platform', 'Server');
            const response = await axios.post(
                `${InferenceGetModels}`, formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            setModelInfo(response.data)
            setLoading(false);
            console.log(response.data)
        } catch (error) {
            console.log(`error fetching inference models , ${error}`)
        }
    }

    const Inference = async (model, file, index) => {
        // 確保 index 與 selectedFiles 的對應
        try {
            console.log("inferencing")
            const formData = new FormData();
            formData.append('access_token', InferenceToken);
            formData.append('file', file);
            formData.append('DeviceInfo', '');
            formData.append('modelType', model[1]);
            formData.append('modelName', model[0]);

            const response = await axios.post(
                `${RemoteInference}`, formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            setAnnotationInfo(prevInfo => {
                const newInfo = [...prevInfo];
                newInfo[index] = response.data;
                return newInfo;
            });
            console.log(response.data);
        } catch (error) {
            console.log(`error inferencing imgs , ${error}`);
        }
    };

    const drawBoxes = (detections, image, index) => {
        console.log("start drawing details")
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageObj = new Image();

        imageObj.onload = () => {
            canvas.width = imageObj.width;
            canvas.height = imageObj.height;
            ctx.drawImage(imageObj, 0, 0);

            detections.forEach(detection => {
                const { classIndex, confidence, xmax, xmin, ymax, ymin } = detection;
                const x = xmin * canvas.width;
                const y = ymin * canvas.height;
                const width = (xmax - xmin) * canvas.width;
                const height = (ymax - ymin) * canvas.height;
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
                ctx.strokeRect(x, y, width, height);
                ctx.font = "bold 25px Arial";
                ctx.fillStyle = "red";
                ctx.fillText(`Confidence: ${confidence}`, x + 5, y + 50);
                ctx.fillText(`Class: ${classIndex},`, x + 5, y + 30);
            });
            // 將 Canvas 轉換為圖片 URL
            const url = canvas.toDataURL();

            setImageURL(prevURLs => {
                const newURLs = [...prevURLs];
                if (index < newURLs.length) {
                    newURLs[index] = url;
                } else {
                    newURLs.push(url);
                }
                return newURLs;
            });
        };
        imageObj.src = URL.createObjectURL(image);
    };

    useEffect(() => {
        if (selectedFiles[0]) {
            console.log(selectedFiles[0].name)
        }

        console.log(annotationInfo)
        console.log("標註內容長度為", annotationInfo.length)
        console.log("選擇檔案長度為", selectedFiles.length)
        if (annotationInfo.length === selectedFiles.length && selectedFiles.length > 0) {
            console.log("start drawing")
            annotationInfo.forEach((annotation, index) => {
                if (annotation) {
                    console.log(`start drawing No.${index}s annotation`)
                    drawBoxes(annotation.detections, selectedFiles[index], index);
                }
            });
        }
    }, [annotationInfo, selectedFiles]);



    useEffect(() => {
        console.log(imageURL)
        console.log("畫完圖片長度為", imageURL.length)
        if (imageURL.length !== 0 && imageURL.length === selectedFiles.length) {
            setStatus("Done inferencing")
        }

    }, [imageURL]);

    useEffect(() => {
        console.log("當前狀態為", status)

        if (status === "start inferencing") {
            setLoading(true)
        } else if (status === "Done inferencing") {
            setLoading(false)
        }

    }, [status])

    const Loading = () => (
        <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <BounceLoader color={'black'} size={120} />
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        </div>
    );

    const handleModelChange = (modelName, modelType) => {
        setCurrentModel([modelName, modelType])

    };



    const handleImgFeedbackYes = async () => {

        function base64ToBlob(base64) {
            const byteCharacters = atob(base64.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'image/png' });
        }

        function base64ToFile(base64, fileName) {
            const blob = base64ToBlob(base64);
            return new File([blob], fileName, { type: blob.type });
        }

        const feedbackOriginImg = selectedFiles[currentImgCount - 1]
        const feedbackInferenceImg = base64ToFile(imageURL[currentImgCount - 1], `${selectedFiles[currentImgCount - 1].name}_Inference.${selectedFiles[currentImgCount - 1].type.split('/')[1]}`)

        const formData = new FormData();
        formData.append('file', feedbackOriginImg);
        formData.append('file', feedbackInferenceImg);

        try {
            setLoading(true)
            const token = localStorage.getItem('jwtToken');
            const response = await axios.post(
                `${Upload}?username=${userid}&projectname=${projectname}&type=feedback`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });
            // console.log(response.data);
            setLoading(false)

        } catch (error) {
            console.error('Error uploading inference img to backend:', error);
        }

        if (currentImgCount < selectedFiles.length) {
            setCurrentImg(preImgCount => preImgCount + 1)
        } else {
            alert('已處理完所有圖片')
            setStatus("Finished")
        }


    }

    const handleImgFeedbackNo = async () => {

        function base64ToBlob(base64) {
            const byteCharacters = atob(base64.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'image/png' });
        }

        function base64ToFile(base64, fileName) {
            const blob = base64ToBlob(base64);
            return new File([blob], fileName, { type: blob.type });
        }

        const feedbackOriginImg = selectedFiles[currentImgCount - 1]
        const feedbackInferenceImg = base64ToFile(imageURL[currentImgCount - 1], `${selectedFiles[currentImgCount - 1].name}_Inference.${selectedFiles[currentImgCount - 1].type.split('/')[1]}`)

        const formData = new FormData();
        formData.append('file', feedbackOriginImg);
        formData.append('file', feedbackInferenceImg);

        try {
            setLoading(true)
            const token = localStorage.getItem('jwtToken');
            const response = await axios.post(
                `${Upload}?username=${userid}&projectname=${projectname}&type=feedback`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });
            // console.log(response.data);
            setLoading(false)
            setStatus("feedbackInfo")

        } catch (error) {
            console.error('Error uploading inference img to backend:', error);
        }



        // if (currentImgCount > 1) {
        //     setCurrentImg(preImgCount => preImgCount - 1)
        // } else {
        //     alert('已經是第一張圖了')
        // }

    }

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleTextareaChange = (event) => {
        setFeedbackInfo(event.target.value);
    };

    const handleFileChange = (event) => {
        const files = event.target.files;

        if (files) {
            setSelectedFiles(files);
            console.log(files);
            if (currentModel) {
                setStatus("start inferencing")
                Array.from(files).forEach((file, index) => Inference(currentModel, file, index));
            } else {
                console.log('Model not selected');
                alert("Please select a model first")
            }
        }
    };

    const handleSubmitFeedback = async () => {

        try {
            setLoading(true)
            const formData = {
                feedbackInfo: feedbackInfo,
                username: userid,
                projectname: projectname
            }
            setLoading(true)
            const token = localStorage.getItem('jwtToken');
            const response = await axios.post(
                `${FeedbackModify}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            console.log(response.data);
            alert(response.data);
            setLoading(false)
            setStatus("Done inferencing")

            if (currentImgCount < selectedFiles.length) {
                setCurrentImg(preImgCount => preImgCount + 1)
            } else {
                alert('已處理完所有圖片')
                setStatus("Finished")
            }

        } catch (error) {
            console.error('Error uploading feedback info to backend:', error);
        }

    }

    const handleReset = () =>{
        setCurrentModel("");
        setSelectedFiles([]);
        setFeedbackInfo('');
        setImageURL([]);
        setAnnotationInfo([]);
        setCurrentImg(1);
        setStatus('uploading')
    }

    const handleGoBack = async () => {
   
          navigate(`/Step?project=${projectname}`);
        
      };


    useEffect(() => {
        console.log(userid)
        console.log(projectname)
        fetchModels();
    }, [])

    useEffect(() => {
        console.log(currentModel)
        console.log(imageURL)

    }, [currentModel])

    useEffect(() => {
        console.log(feedbackInfo)


    }, [feedbackInfo])


    return (
        loading ? (<Loading />) : (
            <div className="container-fluid bg-light" style={{ height: "100vh", }}  >
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                <Navbar style={{ backgroundColor: 'WHITE', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)' }} className="row rol-cols-3 justify-content-center">
                    <div className="col-4">
                        <Nav className="mr-auto" style={{ marginLeft: "10px" }}>
                            <div className="col-auto mt-4">
                                <button
                                    className="btn ModelSelectPageButton"
                                    style={{ marginLeft: "10px" }}
                                    onClick={() => navigate(-1)}
                                >
                                    <p className="fs-5 fw-bold text-center" style={{ marginLeft: "10px" }}>← Back</p>
                                </button>
                            </div>
                        </Nav>
                    </div>

                    <div className="col-4 d-flex justify-content-center align-items-center">
                        <NavLink to={`/Project?&type=1`} className="mx-auto">
                            <img
                                src={InstAI_icon}

                                className="d-inline-block align-top"
                                style={{ width: "250px", height: "auto" }}
                                alt="InstAI logo"
                            />
                        </NavLink>
                    </div>
                    <div className="col-4" />

                </Navbar>

                {status === "Done inferencing" ? (
                    <div className="container border border-2 mt-5 rounded-5 bg-white " style={{ height: "75vh" }}>

                        <div className="text-center row mt-5" >
                            <div className="col-6 mt-5  d-flex justify-content-center">
                                <img className="img-thumbnail " style={{ width: "auto", height: "50vh" }} src={imageURL[currentImgCount - 1]} />
                                {/* {imageURL ? (imageURL.map((image, index) =>
                                    <img key={index} src={image} alt="Inferenced Image" style={{ width: "200px", height: "200px" }} />
                                )
                                ) : (<></>)} */}

                            </div>
                            <div className="col-6">
                                <div className="container text-center ">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="progress mt-1" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                                <div className="progress-bar  progress-bar-striped progress-bar-animated custom-progress-bar" style={{ width: `${(currentImgCount / imageURL.length) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-start"> {currentImgCount}/{imageURL.length}</p>
                                        </div>
                                    </div>
                                    <div className="container d-flex flex-column align-items-start justify-content-center" style={{ height: "50vh" }}>
                                        <div className="d-flex align-items-center">
                                            <p className="fs-3 fw-bold">Is this result correct?</p>

                                        </div>
                                        <div className="container-fluid row">
                                            <div className="col-6 d-flex justify-content-center">
                                                <div className="btn btn-lg btn-customstyle w-100" onClick={handleImgFeedbackYes}>Yes</div>
                                            </div>
                                            <div className="col-6 d-flex justify-content-center">
                                                <div className="btn btn-lg btn-customstyle w-100" onClick={handleImgFeedbackNo}>No</div>
                                            </div>


                                        </div>
                                    </div>


                                </div>

                            </div>

                        </div>


                    </div>
                ) : status === "feedbackInfo" ? (
                    <div className="container border border-2 mt-5 rounded-5 bg-white " style={{ height: "75vh" }}>

                        <div className="text-center row mt-5" >
                            <div className="col-6 mt-5  d-flex justify-content-center">
                                <img className="img-thumbnail " style={{ width: "auto", height: "50vh" }} src={imageURL[currentImgCount - 1]} />
                                {/* {imageURL ? (imageURL.map((image, index) =>
                            <img key={index} src={image} alt="Inferenced Image" style={{ width: "200px", height: "200px" }} />
                        )
                        ) : (<></>)} */}

                            </div>
                            <div className="col-6">
                                <div className="container text-center ">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="progress mt-1" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                                <div className="progress-bar  progress-bar-striped progress-bar-animated custom-progress-bar" style={{ width: `${(currentImgCount / imageURL.length) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-start"> {currentImgCount}/{imageURL.length}</p>
                                        </div>
                                    </div>
                                    <div className="container d-flex flex-column align-items-start justify-content-center" style={{ height: "50vh" }}>
                                        <div className="d-flex align-items-center">
                                            <p className="fs-3 fw-bold">What's Wrong with this Result?</p>

                                        </div>

                                        <textarea className="form-control w-100" rows="10" placeholder="Send us feedback" value={feedbackInfo} onChange={handleTextareaChange} />
                                        <div className="d-flex justify-content-end w-100">
                                            <div className="btn btn-lg btn-customstyle mt-2" onClick={handleSubmitFeedback}>Submit</div>
                                        </div>
                                    </div>


                                </div>

                            </div>

                        </div>


                    </div>
                ) : status === "uploading" ? (
                    <div className="container border border-2 mt-5 rounded-5 bg-white " style={{ height: "75vh" }}>

                        <p className="fs-3 fw-bold text-center mt-4">Test Model</p>
                        {currentModel ? <p className="fs-5 fw-semibold text-center mt-3">Currnt Model : {currentModel[0]}</p> : <p className="fs-5 fw-semibold text-center mt-3">Please select a model </p>}
                        <div className="d-flex justify-content-end align-items-end me-4">
                            <div className="dropdown mt-3 ms-4">
                                <button className="btn btn-customstyle dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Inference Model select
                                </button>
                                <ul className="dropdown-menu">
                                    {modelsInfo.map((model, index) =>
                                        <li key={index}><a className="dropdown-item" onClick={() => handleModelChange(model.name, model.ModelType)}>{model.name}</a></li>)
                                    }

                                </ul>
                            </div>
                        </div>

                        <div className="container border border-2 mt-3 rounded-2 bg-white d-flex justify-content-center align-items-center" style={{ width: "65vw", height: "50vh" }}>
                            <div className="text-center">
                                <div><i className="bi bi-image fs-1"></i> </div>
                                
                                {/* <p className="fs-5 fw-bold">Drag and drop images here</p>
                                <p className="fs-5 fw-bold">OR</p> */}
                                <div className="btn btn-lg btn-customstyle rounded-3 fw-bold" onClick={handleButtonClick}>Choose file to Upload</div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                        </div>
                    </div>

                ) : status === "Finished" ? (<div className="container border border-2 mt-5 rounded-5 bg-white " style={{ height: "75vh" }}>

                    <div className="text-center row mt-5" >
                        <div className="col-6 mt-5  d-flex justify-content-center">
                            <img className="img-thumbnail " style={{ width: "auto", height: "50vh" }} src={FinishedInference} />
                            {/* {imageURL ? (imageURL.map((image, index) =>
                        <img key={index} src={image} alt="Inferenced Image" style={{ width: "200px", height: "200px" }} />
                    )
                    ) : (<></>)} */}

                        </div>
                        <div className="col-6">
                            <div className="container text-center ">
                                <div className="row">
                                    <div className="col-6">
                                        <div className="progress mt-1" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                            <div className="progress-bar  progress-bar-striped progress-bar-animated custom-progress-bar" style={{ width: `${(currentImgCount / imageURL.length) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <p className="text-start"> {currentImgCount}/{imageURL.length}</p>
                                    </div>
                                </div>
                                <div className="container d-flex flex-column align-items-start justify-content-center" style={{ height: "50vh" }}>
                                    <div className="d-flex align-items-center">
                                        <p className="fs-3 fw-bold">All feedback has been sent to InstAI</p>

                                    </div>

                                    <div className="row w-100">
                                    <div className="col-6">
                                        <div className="btn btn-lg btn-customstyle mt-2" onClick={handleGoBack}>Finish</div>
                                    </div>

                                    <div className="col-6">
                                        <div className="btn btn-lg btn-customstyle mt-2" onClick={handleReset}>Keep testing model</div>
                                    </div>
                                    </div>
                                    
                                </div>


                            </div>

                        </div>

                    </div>


                </div>) : (<></>)}

            </div>

        )

    )
}

export default Inference