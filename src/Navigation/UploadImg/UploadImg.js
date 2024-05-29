import React, { useState, useEffect } from 'react';
import './UploadImg.css';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import InstAI_icon from "../../image/instai_icon.png";
import { FaRegClock } from 'react-icons/fa';
import { Container } from "react-bootstrap";
import { Modal, Button } from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";

function UploadImg() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = localStorage.getItem("userId");
  const [currentPage, setCurrentPage] = useState(1);
  const [imgsPerPage] = useState(10);

  const projectname = searchParams.get('projectname');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const u = process.env.REACT_APP_UPLOAD;
  const c_s = process.env.REACT_APP_CONFIRM_STEP;
  const m_i = process.env.REACT_APP_MODIFY_IMGQUANTITY;
  const [mode, setMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  // Get current imgs
  const indexOfLastImg = currentPage * imgsPerPage;
  const indexOfFirstImg = indexOfLastImg - imgsPerPage;
  const currentImgs = imagePreviews.slice(indexOfFirstImg, indexOfLastImg);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    const fileArray = Array.from(files);

    const allowedFileTypes = ['image/jpeg', 'image/png'];
    const promises = fileArray.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file,
            dimensions: {
              width: 0,
              height: 0,
            },
            fileType: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(promises);

      // Filter files
      const filteredFiles = results.filter((result) =>
        allowedFileTypes.includes(result.fileType)
      );

      setImageFiles((prevFiles) => [...prevFiles, ...filteredFiles.map((result) => result)]);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filteredFiles.map((result) => result.file)]);
      setImagePreviews((prevPreviews) => [...prevPreviews, ...filteredFiles.map((result) => URL.createObjectURL(result.file))]);



      // console.log(imagePreviews)
    } catch (error) {
      console.error('Error reading file information:', error);
    }
  };

  // 處理刪除單一圖片
  const handleDeleteImage = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...imagePreviews];

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setSelectedFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  useEffect(() => {

    console.log('Selected Files:', selectedFiles.length);
  }, [selectedFiles]);

  // 刪除預覽
  const handleDeleteAllPreviews = () => {
    setImagePreviews([]);
    setSelectedFiles([]);
  };
  // 下載預覽 //modified
  const handleDownloadAll = () => {
    selectedFiles.forEach((file) => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([file]));
      // console.log(a.href)
      a.setAttribute("download", file.name);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };
  // 修改step.js中的狀態 使用async 完成才會下一步
  const changeStep = async (status_now) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const formData = { step: status_now, projectname: projectname, username: id };
      const response = await axios.post(
        `${c_s}`, formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState(null);

const handleUpload = async () => {
  if (selectedFiles.length === 0) {
    setModalMessage('請選擇要上傳的圖片!');
    setShowModal(true);
  }
  else if (selectedFiles.length < 10) {
    setModalMessage('请至少選擇10張合格的照片!');
    setShowModal(true);
    return;
  }

  else {
    setModalMessage('要求已經滿足,確定要上傳圖片?');
    setModalCallback(async () => {
      setLoading(true);
      const uploaded = [...selectedFiles];
      const formData = new FormData();
      for (let i = 0; i < uploaded.length; ++i) {
        formData.append('file', uploaded[i]);
      }

      try {
        const token = localStorage.getItem('jwtToken');
        changeStep("Requirement filling"); // 進到狀態2
        const response = await axios.post(
          `${u}?username=${id}&projectname=${projectname}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
        setModalMessage(response.data.message);
        setShowModal(true);

        const response2 = await axios.post(
          `${c_s}/?step=1&username=${id}&projectname=${projectname}`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setLoading(false);
        navigate(`/Step?project=${projectname}`);
      } catch (error) {
        console.error('Error sending data to backend:', error);
      }

      try {
        const token = localStorage.getItem('jwtToken');
        const formData2 = { quantity : imagePreviews.length , username : id , projectname : projectname};
        const response3 = await axios.post(
          `${m_i}/?step=1&username=${id}&projectname=${projectname}`,
          formData2,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        
        console.log(response3.data);
      } catch (error) {
        console.error('Error updating img quantity:', error);
      }
    });
    setShowModal(true);
  }
};


  return (
    <div className="container-fluid p-0 mt-3">
      <div className="row d-flex justify-content-between ">
        <div className="col-auto">
          <img
            src={InstAI_icon}
            className="img-fluid"
            alt="InstAi_Icon"
            style={{ width: '76.8px', height: '76.8px' }}
          />
        </div>
        <div className="custom-border"></div>
      </div>

      <div className='container-fluid p-0 border-top' style={{ height: "100vh" }}>
        <div className='container border border-3 custom-border rounded mt-5' >
          <div className={`card  downloadform`} style={{ height: 100 }}>
            <h1 className="display-4  text-center create-title text-light" style={{ fontWeight: 'bold' }}>
              Upload the data you want
            </h1>
          </div>


          <div className="mt-3" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {loading ? (
              <>
                <Container className="d-flex flex-column justify-content-center" style={{
                  minHeight: '60vh', maxWidth: '50rem', margin: '50px auto', backgroundColor: 'white',
                  borderRadius: '15px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', padding: '20px'
                }}>
                  <h2 className="text-center mb-4">Images are uploading...</h2>
                  {/* <p className="text-center mb-4"> </p>
       <h2 className="text-center mb-4"></h2> */}
                  <div className="text-center">
                    <FaRegClock style={{ animation: 'spin 12s linear infinite' }} size={70} />
                  </div>
                </Container>
              </>
            ) : (<div className='container'>

              <div className="row justify-content-between mb-3">
                <div className="col-4">
                  <label className="btn btn-primary btn-lg">
                    Choose Images
                    <input type="file" accept="image/*" multiple name="images" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </label>
                </div>
                <div className="col-4 d-flex  justify-content-end">
                  <div>
                    {/* <button className={'btn btn-primary'} onClick={selectModel}>
              Select modes
            </button> */}
                  </div>
                  <div className='me-3'>
                    <button className={`btn btn-danger `} onClick={handleDeleteAllPreviews}>
                      Remove all
                    </button>
                  </div>
                  <div className='me-3'>
                    <button className={`btn btn-primary`} onClick={handleDownloadAll}>
                      Download All
                    </button>
                  </div>
                  <div >
                    <button className={`btn btn-success `} onClick={handleUpload}>
                      Done
                    </button>
                  </div>

                </div>
              </div>
              <table className='table table-striped table-hover border custom-border ' >
                <thead>
                  <tr className='table-light text-center'>
                    <th className='fs-5'>Image No.</th>
                    {/* <th  >Labeld</th> */}
                    <th className='fs-5' >Image height</th>
                    <th className='fs-5' >Image width</th>
                    <th className='fs-5' >Delete</th>
                    <th className='fs-5' >Image Display</th>
                  </tr>
                </thead>
                <tbody>
                  {currentImgs.map((preview, index) => (

                    <tr className='text-center align-middle' key={index} style={{ height: "150px" }} >
                      <td className='fw-bold ' >{(currentPage - 1) * 10 + index + 1}</td>
                      {/* <td >{selectedFiles[index].isTagged ? 'Yes' : 'No'}</td> */}
                      <td className='fw-semibold'>512</td>
                      <td className='fw-semibold'>512</td>
                      <td >
                        <button className="btn btn-lg btn-danger" onClick={handleDeleteImage}>
                          Delete
                        </button>
                      </td>
                      <td style={{ flex: 1, textAlign: 'center' }}>
                        <img className='rounded img-thumbnail' src={preview} alt={`image ${index}`} style={{ width: '150px', height: 'auto' }} loading='lazy' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="pagination justify-content-center  mt-5">
                <li className="page-item">
                  <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: Math.ceil(imagePreviews.length / imgsPerPage) }).map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button onClick={() => paginate(i + 1)} className="page-link " >{i + 1}</button>
                  </li>
                ))}
                <li className="page-item">
                  <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === Math.ceil(imagePreviews.length / imgsPerPage)}>
                    &raquo;
                  </button>
                </li>
              </ul>
            </div>)}

          </div>
        </div>
      </div>


<Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton className="d-flex justify-content-between">
    <Modal.Title></Modal.Title>
    <img src={instAI_newicon} alt="InstAI Icon" style={{ width: '170px', height: '58px', marginLeft: "140px" }} />
  </Modal.Header>
  <Modal.Body className="text-center">{modalMessage}</Modal.Body>
  <Modal.Footer className="justify-content-center">
    <Button variant="secondary" onClick={() => setShowModal(false)} className="mr-2">
      NO
    </Button>
    {modalCallback && (
      <Button variant="primary" onClick={() => { modalCallback(); setShowModal(false); }} className="ml-2">
        OK
      </Button>
    )}
  </Modal.Footer>
</Modal>



    </div>
  );
};

export default UploadImg;