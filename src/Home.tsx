import React, { useEffect, useState } from "react";
import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-material-ui";
import {
  Container, Snackbar, Paper, Button, TextField, FormLabel, FormControl,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress
} from "@material-ui/core";
import { Pagination } from '@material-ui/lab';
import Alert from "@material-ui/lab/Alert";
import { toDate, toDateNum, AlertState, getAtaForMint } from './utils';
import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  CANDY_MACHINE_PROGRAM,
} from "./candy-machine";
import CircularProgress from '@material-ui/core/CircularProgress';

import axios from "axios";
import { LocalDiningOutlined } from "@material-ui/icons";

// ********CONST Declaration***********
// const SERVER_URL = 'http://localhost:5000';
const SERVER_URL = 'https://terminter-admin-nas.herokuapp.com';
const SCRAP_DURATION = 5;

const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--card-background-lighter-color) !important;
  margin: 5px;
  padding: 24px;
`;

const CheckBoxWrapper = styled.div`
  position: relative;
`;
const CheckBoxLabel = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 42px;
  height: 26px;
  border-radius: 15px;
  background: #bebebe;
  cursor: pointer;
  &::after {
    content: "";
    display: block;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    margin: 3px;
    background: #ffffff;
    box-shadow: 1px 3px 3px 1px rgba(0, 0, 0, 0.2);
    transition: 0.2s;
  }
`;
const CheckBox = styled.input`
  opacity: 0;
  z-index: 1;
  border-radius: 15px;
  width: 42px;
  height: 26px;
  &:checked + ${CheckBoxLabel} {
    background: #3f51b5;
    &::after {
      content: "";
      display: block;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      margin-left: 21px;
      transition: 0.2s;
    }
  }
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  height: 48px;
  padding: 0 5px 0 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 24px;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;

`;

const MyTable = styled(Table)`
  thead {
    background: black;
    color: white;
  },
  tbody {
    background: white;
    color: black;
  }
  tbody td {
    color: black;
  }
`

const DivPublicKey = styled.div`
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DivDate = styled.div`
  width: 150px;
`
const ConnectButton = styled(WalletMultiButton)`
`;
const Logo = styled.div`
  flex: 0 0 auto;

  img {
    height: 60px;
  }
`;
const Menu = styled.ul`
  list-style: none;
  display: inline-flex;
  flex: 1 0 auto;

  li {
    margin: 0 12px;

    a {
      color: var(--main-text-color);
      list-style-image: none;
      list-style-position: outside;
      list-style-type: none;
      outline: none;
      text-decoration: none;
      text-size-adjust: 100%;
      touch-action: manipulation;
      transition: color 0.3s;
      padding-bottom: 15px;

      img {
        max-height: 26px;
      }
    }

    a:hover, a:active {
      color: rgb(131, 146, 161);
      border-bottom: 4px solid var(--title-text-color);
    }

  }
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const ShimmerTitle = styled.h1`
  margin: 30px auto;
  text-transform: uppercase;
  animation: glow 2s ease-in-out infinite alternate;
  color: var(--main-text-color);
  @keyframes glow {
    from {
      text-shadow: 0 0 20px var(--main-text-color);
    }
    to {
      text-shadow: 0 0 30px var(--title-text-color), 0 0 10px var(--title-text-color);
    }
  }
`;

export interface HomeProps {
  connection: anchor.web3.Connection;
  txTimeout: number;
  rpcHost: string;
}

interface MachineInfo {
  _id: string,
  image_url: string,
  machine_type: string,
  machine_id: string,
  admin: string,
  price: number,
  total_items: number,
  machine_collection: string,
  go_live_date: number,
  captcha: boolean
}

const Home = (props: HomeProps) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState('add');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [machineId, setMachineId] = useState('');
  const [machineType, setMachineType] = useState('CM2');
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [isAutoScrape, setIsAutoScrape] = useState(true)
  const [timerId, setTimerId] = useState(0);
  const [autoLoading, setAutoLoading] = useState(false);
  const CORS_PROXY_API = `https://magiceden.boogle-cors.workers.dev?u=`;

  const [machine, setMachine] = useState<MachineInfo>({
    _id: '1',
    image_url: '/logo.png',
    machine_type: 'CM2',
    machine_id: 'machine',
    admin: 'admin',
    price: 0.5,
    machine_collection: '',
    go_live_date: 1642280400,
    total_items: 30,
    captcha: false
  });
  const [machines, setMachines] = useState<any[]>([]);
  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = '/';
  }
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const rpcUrl = props.rpcHost;

  const onPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMachine({ ...machine, [event.target.name]: event.target.value })
  }

  const onMachineIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMachineId(event.target.value);
  }

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }

  const onMachineTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMachineType(event.target.value as string);
  }

  const getMachineInfo = async () => {
    // if (machineType == 'ME') {
    //   setAlertState({
    //     open: true,
    //     message: 'Magic Eden is not supported yet.',
    //     severity: 'warning'
    //   })
    //   return
    // }

    if (!machineId) {
      setAlertState({
        open: true,
        message: 'Input Machine Id.',
        severity: 'warning'
      })
      return
    }

    const candyMachineId = new anchor.web3.PublicKey(machineId)

    setLoading(true)
    try {
      const cndy = await getCandyMachineState(
        wallet as anchor.Wallet,
        candyMachineId,
        props.connection
      );
      const machineInfo: MachineInfo = {
        _id: '',
        image_url: cndy.state.imageUrl,
        machine_type: 'CM2',
        machine_id: cndy.id.toString(),
        admin: cndy.state.treasury.toString(),
        price: cndy.state.price.toNumber() / LAMPORTS_PER_SOL,
        go_live_date: cndy.state.goLiveDate?.toNumber(),
        machine_collection: cndy.state.name,
        total_items: cndy.state.itemsAvailable,
        captcha: cndy.state.gatekeeper == null ? false : true
      }
      handleMachineOpen(machineInfo, 'add')
      setLoading(false);
    } catch (err: any) {
      alert(err)
      setLoading(false);
    }
  }

  const getMachines = () => {

    setLoading(true);
    let data = '?';
    data += `page=${page}`;
    if (search) {
      data = `${data}&search=${search}`;
    }
    axios.get(`${SERVER_URL}/get-machines${data}`).then((res) => {
      setLoading(false)
      setMachines(res.data.machines)
      setPages(res.data.pages)
    }).catch((err) => {
      setAlertState({
        open: true,
        message: 'server error!',
        severity: 'error'
      })
      setLoading(false)
      setMachines([])
      setPages(0)
    });
  }

  const addMachine = () => {

    axios.post(`${SERVER_URL}/add-machine`, machine).then((res) => {
      setAlertState({
        open: true,
        message: res.data.message,
        severity: 'success'
      })

      handleMachineClose();
      getMachines();
    }).catch((err) => {
      setAlertState({
        open: true,
        message: 'server error!',
        severity: 'error'
      })
      handleMachineClose();
    });

  }

  const editMachine = () => {
    axios.post(`${SERVER_URL}/edit-machine`, machine).then((res) => {

      setAlertState({
        open: true,
        message: res.data.message,
        severity: 'success'
      })

      handleMachineClose();
      getMachines()
    }).catch((err) => {
      setAlertState({
        open: true,
        message: 'server error!',
        severity: 'error'
      })
      handleMachineClose();
    });
  }

  const scrapeMEInfo = async () => {
    let meInfo = await axios({
      method: 'get',
      url: `${CORS_PROXY_API}https://api-mainnet.magiceden.io/launchpad_collections`
    });
    for (let i = 0; i < meInfo.data.length; i++) {
      if (meInfo.data[i]?.mint) {
        let res = await axios.post(`${SERVER_URL}/get-machine`, { machine_id: meInfo.data[i]?.mint.candyMachineId })
        if (!res.data.isExist) {
          const machineInfo: MachineInfo = {
            _id: '',
            image_url: meInfo.data[i].image,
            machine_type: 'ME',
            machine_id: meInfo.data[i].mint.candyMachineId,
            admin: meInfo.data[i].mint.treasury,
            price: meInfo.data[i].price,
            go_live_date: Date.parse(meInfo.data[i].launchDate) / 1000,
            machine_collection: meInfo.data[i].name,
            total_items: meInfo.data[i].size,
            captcha: false
          }
          await axios.post(`${SERVER_URL}/add-machine`, machineInfo);
          getMachines();
        }
      }
    }
  }
  const scrapeCM2Info = async () => {
    setScrapeLoading(true);
    console.log("start")
    let signatures = await props.connection.getSignaturesForAddress(
      new anchor.web3.PublicKey(CANDY_MACHINE_PROGRAM),
      {
        "limit": 100
      }
    );
    console.log(signatures)
    if (signatures?.length) {
      for (let i = 0; i < signatures.length; i++) {
        let res = await axios.post(props.rpcHost, {
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getTransaction",
          "params": [
            signatures[i].signature
          ]
        });
        if (res.data?.result.transaction.message.instructions.length == 1) {
          const machineId = res.data.result.transaction.message.accountKeys[1];
          res = await axios.post(`${SERVER_URL}/get-machine`, { machine_id: machineId })
          if (!res.data.isExist) {
            try {
              const cndy = await getCandyMachineState(
                wallet as anchor.Wallet,
                machineId.toString(),
                props.connection
              );
              const machineInfo: MachineInfo = {
                _id: '',
                image_url: cndy.state.imageUrl,
                machine_type: 'CM2',
                machine_id: cndy.id.toString(),
                admin: cndy.state.treasury.toString(),
                price: cndy.state.price.toNumber() / LAMPORTS_PER_SOL,
                go_live_date: cndy.state.goLiveDate?.toNumber(),
                machine_collection: cndy.state.name,
                total_items: cndy.state.itemsAvailable,
                captcha: cndy.state.gatekeeper == null ? false : true
              }
              await axios.post(`${SERVER_URL}/add-machine`, machineInfo)
              getMachines();
            } catch (err: any) {
            }
          }
        }
        if (i == (signatures.length - 1)) {
          setScrapeLoading(false);
          setLoading(false);
          setAutoLoading(false)
        }
      }
    }
  }
  const scrapeMachineInfo = async () => {
    await scrapeMEInfo()
    await scrapeCM2Info();
  }
  const myInterval = () => {
    scrapeMachineInfo();
    const id = window.setInterval(() => { scrapeMachineInfo() }, SCRAP_DURATION * 60 * 1000)
    return id;
  }
  const startAutoScrape = () => {
    setAutoLoading(true)
    const id = myInterval()
    setTimerId(id)
  }
  const pauseAutoScrape = () => {
    if (timerId) {
      window.clearInterval(timerId);
    }
  }

  const deleteMachine = (id: string) => {
    axios.post(`${SERVER_URL}/delete-machine`, {
      id: id
    }).then((res) => {

      setAlertState({
        open: true,
        message: res.data.message,
        severity: 'success'
      })
      getMachines()
    }).catch((err) => {
      setAlertState({
        open: true,
        message: 'server error!',
        severity: 'error'
      })
    });
  }

  const handleMachineOpen = (data: MachineInfo, mode: string) => {
    setModalMode(mode);
    setOpenEditModal(true);
    setMachine(data);
  }

  const handleMachineClose = () => {
    setOpenEditModal(false)
  }
  const deletAllMachines = () => {
    axios.post(`${SERVER_URL}/delete-all-machines`).then((res) => {

      setAlertState({
        open: true,
        message: res.data.message,
        severity: 'success'
      })
      getMachines()
    }).catch((err) => {
      setAlertState({
        open: true,
        message: 'server error!',
        severity: 'error'
      })
    });
  }
  function throwConfetti(): void {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
  useEffect(startAutoScrape, []);

  useEffect(getMachines, [page, search]);
  return (
    <div>
      {(scrapeLoading && !isAutoScrape && !autoLoading) &&
        <div className="bg-fixed">
          <div className="bg-loading">
          </div>
          <div className='active-loading'>
            <CircularProgress />
          </div>
          <span className="scrape-loading">Scraping CM2... Wait for a few minutes</span>
        </div>

      }
      {loading && <LinearProgress color="secondary" />}
      <Container>
        <MainContainer>
          <WalletContainer>
            <Logo><img alt="" src="logo.png" /></Logo>
            <Menu>
              {/* <li><a href="http://localhost:3000/" target="_blank" rel="noopener noreferrer">Machines</a>
              </li> */}
            </Menu>

            <FormLabel style={{ marginTop: 12, marginRight: 10 }}>AUTO SCRAPE: </FormLabel>

            <div className="btn-switch">
              <CheckBoxWrapper>
                <CheckBox
                  id="checkbox"
                  type="checkbox"
                  checked={isAutoScrape}
                  onChange={e => {
                    setIsAutoScrape(e.target.checked);
                    if (e.target.checked) {
                      startAutoScrape()
                    } else {
                      pauseAutoScrape()
                    }
                  }}
                />
                <CheckBoxLabel htmlFor="checkbox" />
              </CheckBoxWrapper>
            </div>
            <div className="btn-manual">
              <Button
                className="button_style"
                variant="contained"
                color="primary"
                disabled={isAutoScrape}
                onClick={() => {
                  !scrapeLoading && !isAutoScrape && !autoLoading && scrapeMachineInfo();
                  scrapeLoading && !isAutoScrape && autoLoading &&
                    setAlertState({
                      open: true,
                      message: 'Just a minute',
                      severity: 'error'
                    })
                }
                }
              >
                {isAutoScrape ? 'Scraping Now' : 'Scrape CM2'}
              </Button>
            </div>
            <div className="btn-manual">
              <Button
                className="button_style"
                variant="contained"
                color="primary"
                onClick={() => {
                  logout()
                }
                }
              >
                Logout
              </Button>
            </div>
          </WalletContainer>
          <ShimmerTitle>Terminter Admin</ShimmerTitle>
          <br />
        </MainContainer>

        <Dialog
          open={openEditModal}
          onClose={handleMachineClose}
          fullWidth={true}
          maxWidth={'md'}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{modalMode == 'add' ? 'Add' : 'Edit'} Machine</DialogTitle>
          <Divider />
          <DialogContent>
            <div className="detail_info">
              <FormLabel >Machine Type</FormLabel>
              <FormLabel >{machine.machine_type}</FormLabel>
            </div>
            <div className="detail_info">
              <FormLabel >Machine ID</FormLabel>
              <FormLabel >{machine.machine_id}</FormLabel>
            </div>
            <div className="detail_info">
              <FormLabel >Machine Admin</FormLabel>
              <FormLabel >{machine.admin}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >NFT Price</FormLabel>
              <FormLabel >{machine.price} SOL</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Machine Collection</FormLabel>
              <FormLabel >{machine.machine_collection}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >GoLiveDate</FormLabel>
              <FormLabel >{toDateNum(machine.go_live_date).toString()}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Total items</FormLabel>
              <FormLabel>{machine.total_items}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Captcha</FormLabel>
              <FormLabel >{machine.captcha ? 'Yes' : 'No'}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Image Url</FormLabel>
              <TextField
                id="standard-basic"
                type="text"

                autoComplete="off"
                name="image_url"
                value={machine.image_url}
                onChange={onInputChange}
                placeholder="URL"
                required
              />
            </div>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button onClick={handleMachineClose} variant="contained" color="primary">
              Cancel
            </Button>
            {modalMode == 'add' ?
              <Button
                disabled={machine.image_url == ''}
                onClick={() => addMachine()} variant="contained" color="primary" autoFocus>
                Add Machine
              </Button> :
              <Button
                disabled={machine.image_url == ''}
                onClick={(e) => editMachine()} variant="contained" color="primary" autoFocus>
                Edit Machine
              </Button>
            }
          </DialogActions>
        </Dialog>

        {/* Edit Machine */}
        <Dialog
          open={openEditModal}
          onClose={handleMachineClose}
          fullWidth={true}
          maxWidth={'md'}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{modalMode == 'add' ? 'Add' : 'Edit'} Machine</DialogTitle>
          <Divider />
          <DialogContent>
            <div className="detail_info">
              <FormLabel >Machine Type</FormLabel>
              <FormLabel >{machine.machine_type}</FormLabel>
            </div>
            <div className="detail_info">
              <FormLabel >Machine ID</FormLabel>
              <FormLabel >{machine.machine_id}</FormLabel>
            </div>
            <div className="detail_info">
              <FormLabel >Machine Admin</FormLabel>
              <FormLabel >{machine.admin}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >NFT Price</FormLabel>
              <FormLabel >{machine.price} SOL</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Machine Collection</FormLabel>
              <FormLabel >{machine.machine_collection}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >GoLiveDate</FormLabel>
              <FormLabel >{toDateNum(machine.go_live_date).toString()}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Total items</FormLabel>
              <FormLabel>{machine.total_items}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Captcha</FormLabel>
              <FormLabel >{machine.captcha ? 'Yes' : 'No'}</FormLabel>
            </div>

            <div className="detail_info">
              <FormLabel >Image Url</FormLabel>
              <TextField
                id="standard-basic"
                type="text"

                autoComplete="off"
                name="image_url"
                value={machine.image_url}
                onChange={onInputChange}
                placeholder="URL"
                required
              />
            </div>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button onClick={handleMachineClose} variant="contained" color="primary">
              Cancel
            </Button>
            {modalMode == 'add' ?
              <Button
                disabled={machine.image_url == ''}
                onClick={() => addMachine()} variant="contained" color="primary" autoFocus>
                Add Machine
              </Button> :
              <Button
                disabled={machine.image_url == ''}
                onClick={(e) => editMachine()} variant="contained" color="primary" autoFocus>
                Edit Machine
              </Button>
            }
          </DialogActions>
        </Dialog>

        <div className='top_bar'>
          <div className='wrapper'>
            <FormLabel>TYPE:&nbsp;</FormLabel>
            <FormControl size="small">
              <Select name='type' variant="outlined" value={machineType} onChange={onMachineTypeChange}>
                <MenuItem value="CM2">CM2</MenuItem>
                {/* <MenuItem value="ME">ME</MenuItem > */}
              </Select>
            </FormControl>
          </div>
          <div className='wrapper'>
            <FormLabel>ID:&nbsp;</FormLabel>
            <TextField
              id="standard-basic"
              type="text"
              variant="outlined"
              size="small"
              name="machine_id"
              value={machineId}
              onChange={onMachineIdChange}
              placeholder="Machine Id"
              required
            />
          </div>
          <Button
            className="button_style"
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={getMachineInfo}
          >
            Get Machine Info
          </Button>
          <Button
            className="button_style"
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={deletAllMachines}
          >
            Delete All
          </Button>
          <div className="search_bar">
            <TextField
              id="standard-basic"
              type="search"
              variant="outlined"
              size="small"
              name="search"
              value={search}
              onChange={onSearchChange}
              placeholder="Search ID | Admin | Name"
              required
            />
          </div>

        </div>

        <br />
        <TableContainer component={Paper}>
          <MyTable>
            <TableHead>
              <TableRow>
                <TableCell align="center">Machine Image</TableCell>
                <TableCell align="center">Machine Type</TableCell>
                <TableCell align="center">Machine Collection</TableCell>
                <TableCell align="center">Machine ID</TableCell>
                <TableCell align="center">Machine Admin</TableCell>
                <TableCell align="center">NFT Price</TableCell>
                <TableCell align="center">Total Items</TableCell>
                <TableCell align="center">GoLiveDate</TableCell>
                <TableCell align="center">Captcha</TableCell>
                <TableCell align="center">Listed At</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {machines.map((row) => (
                <TableRow key={row._id}>
                  <TableCell align="center"><img src={`${row.image_url}`} width="70" height="70" /></TableCell>
                  <TableCell align="center">{row.machine_type}</TableCell>
                  <TableCell align="center">{row.machine_collection}</TableCell>
                  <TableCell align="center"><DivPublicKey>{row.machine_id}</DivPublicKey></TableCell>
                  <TableCell align="center"><DivPublicKey>{row.admin}</DivPublicKey></TableCell>
                  <TableCell align="center">{row.price}</TableCell>
                  <TableCell align="center">{row.total_items}</TableCell>
                  <TableCell align="center"><DivDate>{toDateNum(row.go_live_date).toString()}</DivDate></TableCell>
                  <TableCell align="center">{row.captcha ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="center">{row.date}</TableCell>
                  <TableCell align="center">
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={(e) => handleMachineOpen(row, 'edit')}
                    >
                      Edit
                    </Button>
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={(e) => deleteMachine(row._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </MyTable>
          <br />
          <Pagination count={pages} page={page} onChange={onPageChange} color="primary" />
          <br />
        </TableContainer>
        <br />
        <br />
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
      </Container>
    </div>
  );
};

export default Home;
