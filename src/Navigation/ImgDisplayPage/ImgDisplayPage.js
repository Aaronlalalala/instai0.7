import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Navbar, Nav, Card, Container, Row, Col,  Form } from "react-bootstrap";
import InstAI_icon from "../../image/iconnew.png";
import axios from "axios";
import { FaRegClock } from "react-icons/fa";
import './ImgDisplayPage.css'
import AWS from 'aws-sdk';
import Dropdown from 'react-bootstrap/Dropdown';
import { Modal, Button } from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";


export default function ImgDisplayPage() {
  const p = process.env;
  const u = p.REACT_APP_UPLOAD; //最後傳送要用到的api
  const g_s = p.REACT_APP_GET_STEP; // 獲取狀態
  const c_s = p.REACT_APP_CONFIRM_STEP; // 修改狀態
  const promptapi = p.REACT_APP_PROCESS_PROMPT; // 傳送prompt進行生圖
  const g_c = p.REACT_APP_GET_IMGCOUNT; // 獲取count 
  const m_c = p.REACT_APP_MODIFY_IMGCOUNT; // 修改count 
  const m_i = process.env.REACT_APP_MODIFY_IMGQUANTITY;
  const accessKey = p.REACT_APP_AWS_ACCESS_KEY_ID;
  const secretAccessKey = p.REACT_APP_AWS_SECRET_ACCESS_KEY;
  const region = p.REACT_APP_AWS_REGION;
  // 1. 先確認抓得到狀態
  // 2. 並確認目前的count 
  // 3. 確認抓得到資料

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [status, setStatus] = useState();
  const [selectImg, setSelectImg] = useState([]);
  const [chance, setChance] = useState();
  const [base64Data, setBase64Data] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState(null);
  const [num, setNum] = useState(1);

  const id = localStorage.getItem("userId");
  const [promptData, setPromptData] = useState({});
  const projectName = localStorage.getItem("traing name");
  // 確認promptData
  useEffect(() => {
    const storedData = localStorage.getItem(`${projectName}prmoptData`);
    if (storedData) {
      setPromptData(JSON.parse(storedData));
    }
  }, [projectName]);

  // 抓取step
  const fetchStep = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${g_s}/?username=${id}&projectname=${projectName}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setStatus(response.data);
      // console.log("response data is", response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchStep();
  }, [g_s, id, projectName]);
  // 修改狀態
  const changeStep = async (status_now) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const formData = { step: status_now, projectname: projectName, username: id };
      const response = await axios.post(`${c_s}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  // 獲取count 
  const getCount = async (projectname) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${g_c}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        params: { projectname: projectname, username: id }
      });
      // console.log("response data is", response.data);
      if (response.data === 'error') {
        throw new Error('Error fetching data');
      }
      setChance(response.data.img_generation_remaining_count);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  useEffect(() => {
    getCount(projectName);
  }, [projectName]);

  // 修改count 送出後chance-1 
  const modifyCount = async (projectname, count) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const data = { username: id, projectname: projectname, count: count - 1 }; //count-1 很重要
      const response = await axios.post(`${m_c}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log("Response data is", response.data);
      if (response.data === 'error') {
        throw new Error('Error fetching data');
      }
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  // 傳送prompt進行生圖
  const postSDimg = async (promptData) => {
    // console.log("current chance is", chance);
    // console.log(`currnet num is ${num}`)
    if (chance > 0) {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await axios.post(`${promptapi}?username=${id}&projectname=${projectName}&count=${5 - chance}`, promptData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // console.log(response.data);
        await modifyCount(projectName, chance); // 送出的同時修改count 
        await getCount(projectName); // 修改後重新裝取新的count value 

        setLoading(false);
      } catch (error) {
        console.error("Error sending data to backend:", error);
        setLoading(false);
      }
    } else {
      console.log("no remaining count");
    }
  };

  const resendPromptData = (event) => {
    if (chance > 0) {
      event.preventDefault();
      setModalMessage("Do you need to rewrite the prompt?");
      setModalCallback(() => {
        const newPrompt = window.prompt("Enter new prompt:");
        if (newPrompt) {
          const newNegativePrompt = window.prompt("Enter new Negative prompt:");
          if (newNegativePrompt) {
            const updatedPromptData = { ...promptData, prompt: newPrompt, negative_prompt: newNegativePrompt };
            setPromptData(updatedPromptData);
            localStorage.setItem(`${projectName}prmoptData`, JSON.stringify(updatedPromptData));
            postSDimg(updatedPromptData);
          }
        }
      });
      setShowModal(true);
    } else {
      setModalMessage("Your remaining count is zero");
      setShowModal(true);
      console.log("no remaining count");
    }
  };
  

  const downloadSingleImage = (base64, index) => {
    const link = document.createElement('a');
    link.href = 'data:application/octet-stream;base64,' + base64;
    link.download = `image_${index + 1}.jpg`;
    link.click();
  };

  const handleChangeState = () => {
    setModalMessage("Sure to give up?");
    setModalCallback(() => {
      setLoading(!loading);
    });
    setShowModal(true);
  };
  

  const submitBatch = async() => {
    // console.log(selectImg)
    setModalMessage("Sure to go to next step for model traing");
    setModalCallback(async () => {
      // console.log(selectImg);
      const token = localStorage.getItem('jwtToken');
  
      // 建立一個新的FormData物件
      let formData = new FormData();
  
      // 將每個選擇的圖片轉換為Blob物件，然後添加到FormData物件中
      selectImg.forEach((img, index) => {
        function base64ToBlob(base64) {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray]);
        }
  
        let blob = base64ToBlob(img);
        formData.append('file', blob, `image${index}.jpg`);
  
      });
  
      // 添加其他需要的資訊
      formData.append('username', id);
      formData.append('projectname', projectName);
  
      axios.post(`${u}?username=${id}&projectname=${projectName}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }).then(response => {
        // console.log(response.data);
        if (response.data.message === 'Image uploaded successfully!') {
          setLoading(true);
          changeStep("Image upload");
          setModalMessage("Image uploaded successfully!");
          setShowModal(true);
          navigate(`/Step?project=${projectName}`);
        } else {
          console.log("fail");
        }
      }).catch(error => {
        console.error('Error submitting data:', error);
      });
  
      try {
        const token = localStorage.getItem('jwtToken');
        const formData2 = { quantity : selectImg.length , username : id , projectname : projectName};
        const response3 = await axios.post(
          `${m_i}/?step=1&username=${id}&projectname=${projectName}`,
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
  };
  


  useEffect(() => {
    const url = `https://instaiweb-bucket.s3.amazonaws.com/uploads/${id}/${projectName}/SDImages/SDImages${num}.json`;

    AWS.config.update({
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
      region: region
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: 'instaiweb-bucket',
      Key: `uploads/${id}/${projectName}/SDImages/SDImages${num}.json`
    };



    const checkFileExistence = async () => {
      try {
        await s3.headObject(params).promise();
        return true;
      } catch (err) {
        if (err.code === 'NotFound') {
          return false;
        }
        throw err;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        await checkFileExistence();
        const response = await fetch(url);
        console.log(`fetching ${url}`)
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        // console.log("抓到這些資料",json);
        setBase64Data(Object.values(json)); // 將所有的base64字串存入base64Data
      } catch (error) {
        setModalMessage("data is empty");
        setShowModal(true);
        console.log("error fetching");
        console.log(error)
      } finally {
        setLoading(false);
      }
    };
    

    const pollForFile = async () => {
      setLoading(true);
      const interval = setInterval(async () => {
        const fileExists = await checkFileExistence();
        if (fileExists) {
          clearInterval(interval);
          fetchData();
        }
      }, 5000);
    };

    pollForFile();

    // console.log(`current num = ${num}`)


  }, [num]);

  const handleButtonClick = (num) => {
    setNum(num); // 更新num的值，這將觸發useEffect
  };

  const handleCheck = (e, base64) => {
    if (e.target.checked) {
      setSelectImg(prevSelectImg => [...prevSelectImg, base64]);
    } else {
      setSelectImg(prevSelectImg => prevSelectImg.filter(img => img !== base64));
    }
  };

  useEffect(() => {
    // console.log("選了這些",selectImg);
  }, [handleCheck])


  const LoadingCard = () => (
    <div className="d-flex flex-column justify-content-center" style={{
      minHeight: '60vh', maxWidth: '50rem', margin: '50px auto', backgroundColor: 'white',
      borderRadius: '15px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', padding: '20px'
    }}>
      <h2 className="text-center mb-4">We are fetching your data</h2>
      <p className="text-center mb-4">Estimated time: </p>
      <h2 className="text-center mb-4">3 minutes</h2>
      <div className="text-center">
        <FaRegClock style={{ animation: 'spin 12s linear infinite' }} size={70} />
      </div>

      <Button variant="primary" style={{ width: '50%', marginLeft: '25%', marginTop: "30px" }} onClick={handleChangeState}>
        Cancel Request
      </Button>
      {/* <Button onClick={testButton}>測試</Button> */}
    </div>
  );




  const NavBarCard = () => {
    return (
      <Navbar style={{ backgroundColor: 'WHITE', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)' }} className="row rol-cols-3 justify-content-center">

        <div className="col-12  d-flex justify-content-center align-items-center">
          <Navbar.Brand className="mx-auto">
            <NavLink to={`/Project?&type=1`}>
              <img
                src={InstAI_icon}
                width="200"
                height="60"
                className="d-inline-block align-top"
                alt="InstAI logo"
              />
            </NavLink>
          </Navbar.Brand>
        </div>


      </Navbar>
    );
  };


  return (
    <>
      <NavBarCard />
      <Container>
        <Row className="my-3 align-items-center" >
          <Col md={12} className="text-center">
            <p className="fw-bold fs-3 mt-3">Project : {projectName} has {chance} attempts left.</p>
          </Col>
        </Row>

        <div className="container border border-2">
          {loading ? (
            <LoadingCard />
          ) : (<>
            <Row className="mb-3 ">
              <Col md="auto">
                <Dropdown onSelect={(eventKey) => handleButtonClick(parseInt(eventKey))}>
                  <Dropdown.Toggle variant="outline-primary" style={{ fontSize: "20px", height: "50px" }} className="mt-2">
                    Select Batch
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="1">Batch 1</Dropdown.Item>
                    <Dropdown.Item eventKey="2" disabled={chance >= 3}>Batch 2</Dropdown.Item>
                    <Dropdown.Item eventKey="3" disabled={chance >= 2}>Batch 3</Dropdown.Item>
                    <Dropdown.Item eventKey="4" disabled={chance >= 1}>Batch 4</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <p className="text-center fw-bold fs-3">Current Batch Number: {num} </p>
            <div className="container">
              <div className="row row-cols-5 gy-5 justify-content-between">
                {base64Data.map((base64, index) => (
                  <div key={index} className="col">
                    <div className="card text-bg-light" >
                      <div className="card-header">Image No. {index + 1}</div>
                      <img className="card-img-top mt-1" src={`data:image/jpeg;base64,${base64}`} loading="lazy" />

                      <div className="card-body">
                        <div className="btn btn-primary btn-sm"
                          variant="primary"
                          onClick={() => downloadSingleImage(base64, index)}
                        >
                          Download
                        </div>
                        <Form.Check
                          type="checkbox"
                          label="Select"
                          onChange={(e) => handleCheck(e, base64)}
                          className="mt-2"
                          checked={selectImg.includes(base64)} // 新增此行
                        />
                      </div>


                    </div>

                  </div>
                ))}


              </div>

            </div>
            <Row className="mt-3 justify-content-center" style={{ borderRadius: '5px', padding: '10px' }}>
              <Col md="auto">
                <div className="btn btn-primary"
                  variant="outline-dark"
                  onClick={resendPromptData}
                  style={{ fontSize: "20px", height: "50px", }}
                >
                  <FaRegClock /> Try again ({chance} attempt left)
                </div>
              </Col>
              {!loading && selectImg.length > 0 && (
                <Col md="auto">
                  <Button
                    variant="primary"
                    onClick={submitBatch}
                    style={{ fontSize: "20px", height: "50px", }}
                  >
                    Use {selectImg.length} image(s) for model training
                  </Button>
                </Col>
              )}
            </Row>

          </>
          )}
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

      </Container>
    </>
  );
}