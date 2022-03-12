import React, { Component, useEffect, useState } from "react";
import axios from "axios";
import {
  Container,Snackbar, Button, TextField, FormLabel, FormControl,
  Divider, LinearProgress
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import { toDate, toDateNum, AlertState, getAtaForMint } from './utils';

// const SERVER_URL = 'http://localhost:5000';
const SERVER_URL = 'https://terminter-admin-nas.herokuapp.com';
const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });
  const onSubmit = () => {
    try {
      if(id != '' && password != '') {
        axios.post(`${SERVER_URL}/user/login`, {
          user_id: id,
          password
        }).then((res) => {
          console.log(res)
          if(res.data.status) {
            setAlertState({
              open: true,
              message: 'Success.',
              severity: 'success'
            });
            localStorage.setItem("user", JSON.stringify(res.data));
            window.location.href = "/mint"
          }
        })
      } else {
        setAlertState({
          open: true,
          message: 'Incorrect value.',
          severity: 'warning'
        })
      }
    } catch(err) {
      setAlertState({
        open: true,
        message: 'server error.',
        severity: 'error'
      })
    }
    
    
  }
  useEffect(() => {localStorage.removeItem("user")},[])
  return (
    <div className="login">
      <div className="input_login_data">
        <FormLabel>USER NAME:&nbsp;</FormLabel>
        <TextField
          id="standard-basic"
          type="input"
          variant="outlined"
          size="small"
          className="input_id"
          value={id}
          onChange={(e) => {setId(e.target.value)}}
          placeholder="User Name"
          required
        />
      </div>
      <div className="input_login_data">
        <FormLabel>PASSWORD:&nbsp;</FormLabel>
        <TextField
          id="standard-basic"
          type="password"
          variant="outlined"
          size="small"
          className="input_pwd"
          value={password}
          placeholder="Password"
          onChange={(e) => {setPassword(e.target.value)}}
          required
        />
      </div>
      <div className="login_click">
        <Button
          className="btn_login"
          variant="contained"
          color="primary"
          onClick={onSubmit}
        >
          Login
        </Button>
      </div>
      <Snackbar
          open={alertState.open}
          autoHideDuration={6000}
          onClose={() => setAlertState({ ...alertState, open: false })}
        >
          <Alert
            onClose={() => setAlertState({ ...alertState, open: false })}
            severity={alertState.severity}
          >
            {alertState.message}
          </Alert>
        </Snackbar>
    </div>
  );
};

export default Login;
