import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import InstAIIcon from "../../image/instai_icon.png";

const CenteredAlert = ({ message, variant = 'info', onConfirm, onCancel }) => {
  const [show, setShow] = useState(true);

  const handleClose = (result) => {
    setShow(false);
    result ? onConfirm() : onCancel();
  };

  if (show) {
    return (
      <Modal show={show} onHide={() => handleClose(false)} centered>
        <Card>
          <Card.Header>
            <img src={InstAIIcon} alt="Logo" />
          </Card.Header>
          <Card.Body>
            <Alert variant={variant} onClose={() => handleClose(false)} dismissible>
              {message}
            </Alert>
          </Card.Body>
          <Card.Footer>
            <Button variant="primary" onClick={() => handleClose(true)}>確定</Button>
            <Button variant="secondary" onClick={() => handleClose(false)}>取消</Button>
          </Card.Footer>
        </Card>
      </Modal>
    );
  }

  return null;
};

export default CenteredAlert;
