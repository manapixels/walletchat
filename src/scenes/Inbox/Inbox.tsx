import {
   Box,
   Heading,
   Flex,
   Stack,
   SkeletonCircle,
   SkeletonText,
   Text,
   Spinner,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Web3 from 'web3'
import StartConversationWithAddress from '../../components/StartConversationWithAddress'
import { getIpfsData } from '../../services/ipfs'
import MessageType from '../../types/Message'
import MessageUIType from '../../types/MessageUI'
import ConversationItem from './components/ConversationItem'
import EncryptedMsgBlock from '../../types/Message'
import EthCrypto, { Encrypted } from 'eth-crypto'

const Divider = styled.div`
   display: block;
   width: 100%;
   height: 1px;
   margin-bottom: var(--chakra-space-4);
   &::before {
      content: '';
      display: block;
      margin-left: var(--chakra-space-5);
      width: 40px;
      height: 1px;
      border-bottom: 1px solid #cbcbcb;
   }
`

const Inbox = ({
   account,
   privateKey,
   web3,
   isAuthenticated,
}: {
   account: string
   privateKey: string
   web3: Web3
   isAuthenticated: boolean
}) => {
   const [inboxData, setInboxData] = useState<MessageType[]>(
      new Array<MessageType>()
   )
   const [isFetchingInboxData, setIsFetchingInboxData] =
      useState<boolean>(false)
   const [loadedMsgs, setLoadedMsgs] = useState<MessageUIType[]>([])
   const [beenHereFor3Secs, setBeenHereFor3Secs] = useState(false)

   useEffect(() => {
      const interval = setInterval(() => {
         getInboxData()
       }, 5000) // every 5s

       setTimeout(() => setBeenHereFor3Secs(true), 3000)
     
       return () => clearInterval(interval)
   }, [])

   useEffect(() => {
      getInboxData()
   }, [isAuthenticated, account])

   function getInboxData() {
      // GET request to get off-chain data for RX user
      if (!process.env.REACT_APP_REST_API) {
         console.log('REST API url not in .env', process.env)
         return
      }
      if (!account) {
         console.log('No account connected')
         return
      }
      if (!isAuthenticated) {
         console.log('Not authenticated')
         return
      }
      setIsFetchingInboxData(true)
      fetch(` ${process.env.REACT_APP_REST_API}/get_inbox/${account}`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      })
         .then((response) => response.json())
         .then((data: MessageType[]) => {
            console.log('✅ GET [Inbox]:', data)
            if (data === null) setInboxData([])
            else setInboxData(data)
         // .then(async (data: MessageType[]) => {
         //    console.log('✅[GET][Inbox]:', data)

            //const replica = JSON.parse(JSON.stringify(data));

            // // Get data from IPFS and replace the message with the fetched text
            // for (let i = 0; i < replica.length; i++) {
            //    const rawmsg = await getIpfsData(replica[i].message)
            //    //console.log("raw message decoded", rawmsg)

            //    let encdatablock: EncryptedMsgBlock = JSON.parse(rawmsg);

            //    //we only need to decrypt the side we are print to UI (to or from)
            //    let decrypted;
            //    if(replica[i].toaddr === account) {
            //       decrypted = await EthCrypto.decryptWithPrivateKey(
            //       privateKey,
            //       encdatablock.to)
            //    }
            //    else {
            //       decrypted = await EthCrypto.decryptWithPrivateKey(
            //       privateKey,
            //       encdatablock.from)
            //    }

            //    replica[i].message = decrypted
            // }

            //setInboxData(replica)
            
            // TODO: DECRYPT MESSAGES HERE / https://github.com/cryptoKevinL/extensionAccessMM/blob/main/sample-extension/index.js
            setIsFetchingInboxData(false)
         })
         .catch((error) => {
            console.error('🚨[GET][Inbox]:', error)
            setIsFetchingInboxData(false)
         })
   }

   useEffect(() => {
      const populateUI = async () => {
         const toAddToUI = [] as MessageUIType[]

         for (let i = 0; i < inboxData.length; i++) {
            if (
               inboxData[i] &&
               inboxData[i].toaddr &&
               inboxData[i].toaddr.toLowerCase() === account.toLowerCase()
            ) {
               toAddToUI.push({
                  ...inboxData[i],
                  message: await getIpfsData(inboxData[i].message),
                  fromAddr: inboxData[i].fromaddr,
                  toAddr: inboxData[i].toaddr,
                  position: 'left',
                  isFetching: false,
               })
            } else if (
               inboxData[i] &&
               inboxData[i].toaddr &&
               inboxData[i].fromaddr.toLowerCase() === account.toLowerCase()
            ) {
               toAddToUI.push({
                  ...inboxData[i],
                  message: await getIpfsData(inboxData[i].message),
                  fromAddr: inboxData[i].fromaddr,
                  toAddr: inboxData[i].toaddr,
                  position: 'right',
                  isFetching: false,
               })
            }
         }
         setLoadedMsgs(toAddToUI)
      }
      populateUI()
   }, [inboxData, account])

   if (isFetchingInboxData && inboxData.length === 0 && !beenHereFor3Secs) {
      return (
         <Box background="white" height="100vh">
            <Box py={8} px={3} height="100vh">
               {[...Array(5)].map((e, i) => (
                  <Stack key={i}>
                     <Flex
                        py={6}
                        px={3}
                        bg="white"
                        borderBottom="1px solid var(--chakra-colors-lightgray-300)"
                     >
                        <SkeletonCircle
                           size="10"
                           startColor="lightgray.200"
                           endColor="lightgray.400"
                           flexShrink={0}
                           mr={4}
                        />
                        <SkeletonText
                           noOfLines={2}
                           spacing="4"
                           startColor="lightgray.200"
                           endColor="lightgray.400"
                           width="100%"
                        />
                     </Flex>
                  </Stack>
               ))}
            </Box>
         </Box>
      )
   }

   return (
      <Box background="white" minHeight="100vh">
         <Box p={5}>
            <Heading size="xl">
               Inbox {isFetchingInboxData && <Spinner />}
            </Heading>
         </Box>
         <Divider />

         {loadedMsgs.map((conversation, i) => (
            <ConversationItem
               key={conversation.timestamp.toString()}
               data={conversation}
               account={account}
            />
         ))}
         {loadedMsgs.length === 0 && (
            <Box p={5}>
               <Text mb={4} fontSize="md">You have no messages.</Text>
               <StartConversationWithAddress web3={web3} />
            </Box>
         )}
      </Box>
   )
}

export default Inbox
