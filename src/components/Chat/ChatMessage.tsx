import { Box, Button, Spinner, Flex, Image, Text } from '@chakra-ui/react'
import { Link as RLink } from 'react-router-dom'
import styled from 'styled-components'
import Blockies from 'react-blockies'
import { IconCheck, IconChecks, IconExternalLink } from '@tabler/icons'
import { useCallback, useEffect, useState, memo, useRef } from 'react'
import equal from 'fast-deep-equal/es6'

import { formatMessageDate } from '../../helpers/date'
import { MessageUIType } from '../../types/Message'
import { BlockieWrapper } from '../../styled/BlockieWrapper'
import NFT from '../../types/NFT'
import OpenSeaNFT, { openseaToGeneralNFTType } from '../../types/OpenSea/NFT'
import AlchemyNFT, { alchemyToGeneralNFTType } from '../../types/Alchemy/NFT'
import UserProfileContextMenu from '../UserProfileContextMenu'
import { useIsInViewport } from '../../helpers/useIsInViewport'

const MessageBox = styled.div`
   position: relative;
   width: auto;
   min-width: 75px;
   max-width: 80%;
   height: auto;
   background: #fff;
   background: var(--chakra-colors-lightgray-300);
   border-radius: var(--chakra-radii-md);
   padding: var(--chakra-space-2) var(--chakra-space-3) var(--chakra-space-5);
   font-size: var(--chakra-fontSizes-md);
   clear: both;
   word-break: break-word;

   .msg-img {
      display: inline-block;
   }

   .msg-bubble {
      display: inline-block;
   }

   .name {
      color: var(--chakra-colors-information-600);
   }

   &.left {
      float: left;
      background: #fff;
   }
   &.right {
      float: left;
      background: var(--chakra-colors-darkgray-800);
      color: var(--chakra-colors-lightgray-100);

      .name {
         color: var(--chakra-colors-white);
      }
      .chakra-menu__menu-list {
         color: #000;
      }

      .nft-context-btn {
         background: var(--chakra-colors-darkgray-600);
         color: var(--chakra-colors-lightgray-500);
         color: var(--chakra-colors-white);
         &:hover {
            background: var(--chakra-colors-darkgray-500);
            color: var(--chakra-colors-lightgray-500);
         }
      }
   }
   .timestamp {
      display: block;
      position: absolute;
      /* right: var(--chakra-space-7); */
      right: var(--chakra-space-2);
      bottom: var(--chakra-space-2);
      color: #aaa;
      font-size: var(--chakra-fontSizes-sm);
      user-select: none;
      line-height: 1.2;
   }
   &.left {
      .timestamp {
         right: var(--chakra-space-2);
      }
   }
   .read-status {
      position: absolute;
      right: var(--chakra-space-2);
      bottom: var(--chakra-space-2);
      svg {
         stroke: var(--chakra-colors-lightgray-800);
      }
   }
   &.read:not(.left) {
      .timestamp {
         color: darkgreen;
         user-select: none;
      }
      .read-status {
         svg {
            stroke: darkgreen;
         }
      }
   }
   &.right {
      &.read {
         .timestamp {
            color: var(--chakra-colors-success-500);
            user-select: none;
         }
         .read-status {
            svg {
               stroke: var(--chakra-colors-success-500);
            }
         }
      }
   }
`

const ChatMessage = ({
   context,
   account,
   msg,
   updateRead,
}: {
   context: 'dms' | 'nfts' | 'communities'
   account: string | undefined
   msg: MessageUIType
   updateRead?: (data: MessageUIType) => void
}) => {
   const [nftData, setNftData] = useState<NFT>()

   const messageRef = useRef(null)
   const isInViewport = useIsInViewport(messageRef)

   useEffect(() => {
      const getNftMetadata = () => {
         if (!msg.nftAddr || !msg.nftId) {
            // console.log('Missing contract address or id')
            return
         }

         const fetchFromOpenSea = () => {
            if (process.env.REACT_APP_OPENSEA_API_KEY === undefined) {
               console.log('Missing OpenSea API Key')
               return
            }
            fetch(
               `https://api.opensea.io/api/v1/asset/${msg.nftAddr}/${msg.nftId}?account_address=${account}`,
               {
                  method: 'GET',
                  headers: {
                     Authorization: process.env.REACT_APP_OPENSEA_API_KEY,
                  },
               }
            )
               .then((response) => response.json())
               .then((result: OpenSeaNFT) => {
                  if (result?.collection?.name && !equal(result, nftData)) {
                     console.log(`✅[GET][NFT]:`, result)
                     setNftData(openseaToGeneralNFTType(result))
                  }
               })
               .catch((error) => {
                  console.log(`🚨[GET][NFT Contract][OpenSea]:`, error)
                  fetchFromAlchemy()
               })
         }

         const fetchFromAlchemy = () => {
            if (process.env.REACT_APP_ALCHEMY_API_KEY_POLYGON === undefined) {
               console.log('Missing Alchemy API Key')
               return
            }
            fetch(
               `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY_POLYGON}/getNFTMetadata?contractAddress=${msg?.nftAddr}&tokenId=${msg?.nftId}`,
               {
                  method: 'GET',
               }
            )
               .then((response) => response.json())
               .then((data: AlchemyNFT) => {
                  console.log('✅[GET][NFT Metadata]:', data)
                  setNftData(alchemyToGeneralNFTType(data))
               })
               .catch((error) => console.log('error', error))
         }

         fetchFromOpenSea()
      }
      if (context === 'dms') {
         getNftMetadata()
      }
   }, [msg, account, context, nftData])

   const setMessageAsRead = useCallback(() => {
      if (msg.toAddr && msg.fromAddr && msg.timestamp) {
         fetch(
            ` ${process.env.REACT_APP_REST_API}/update_chatitem/${msg.fromAddr}/${msg.toAddr}}`,
            {
               method: 'PUT',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                  ...msg,
                  read: true,
               }),
            }
         )
            .then((response) => response.json())
            .then((data) => {
               console.log('✅[PUT][Message]:', data)
               updateRead && updateRead(data)
            })
            .catch((error) => {
               console.error('🚨[PUT][Message]:', error)
            })
      }
   }, [msg, updateRead])

   useEffect(() => {
      if (
         context === 'dms' &&
         isInViewport &&
         msg?.read === false &&
         msg?.toAddr?.toLocaleLowerCase() === account?.toLocaleLowerCase()
      ) {
         setMessageAsRead()
      }
   }, [
      isInViewport,
      account,
      context,
      msg?.read,
      msg?.toAddr,
      setMessageAsRead,
   ])

   return (
      <Flex
         alignItems="flex-start"
         margin="var(--chakra-space-3) var(--chakra-space-4)"
      >
         <Box
            className="msg-img"
            style={{ backgroundImage: `url(${msg.img})` }}
            padding="var(--chakra-space-2) var(--chakra-space-3)"
         >
            {msg.fromAddr && (
               <UserProfileContextMenu address={msg.fromAddr}>
                  <BlockieWrapper>
                     <Blockies
                        seed={msg.fromAddr.toLocaleLowerCase()}
                        scale={4}
                     />
                  </BlockieWrapper>
               </UserProfileContextMenu>
            )}
         </Box>

         <MessageBox
            className={`msg ${msg.position} ${msg.read && 'read'}`}
            ref={messageRef}
         >
            <Box className="msg-bubble">
               {msg?.sender_name && msg?.fromAddr && (
                  <UserProfileContextMenu address={msg.fromAddr}>
                     <Text fontSize="md" className="name">
                        {msg.sender_name}
                     </Text>
                  </UserProfileContextMenu>
               )}
               <Box>{msg.message}</Box>
               <Box
                  d="inline-block"
                  className="timestamp"
                  style={{
                     right: updateRead
                        ? 'var(--chakra-space-7)'
                        : 'var(--chakra-space-2)',
                  }}
               >
                  {formatMessageDate(new Date(msg.timestamp))}
               </Box>

               {msg.position === 'right' &&
                  (msg.read === true || msg.read === false) && (
                     <span className="read-status">
                        {msg.isFetching ? (
                           <Spinner size="xs" />
                        ) : msg.read ? (
                           <IconChecks size={15} />
                        ) : (
                           <IconCheck size={15} />
                        )}
                     </span>
                  )}
            </Box>
            {msg.nftAddr && msg.nftId && account && (
               <Box mb={1}>
                  {nftData && (
                     <RLink
                        to={`/nft/ethereum/${msg.nftAddr}/${
                           msg.nftId
                        }?recipient=${
                           msg.toAddr === account ? msg.fromAddr : msg.toAddr
                        }`}
                        style={{ textDecoration: 'none' }}
                     >
                        <Button p={2} height="auto" className="nft-context-btn">
                           <Flex alignItems="center">
                              {nftData?.image && (
                                 <Image
                                    src={nftData?.image}
                                    alt=""
                                    height="15px"
                                    borderRadius="var(--chakra-radii-sm)"
                                    mr={1}
                                 />
                              )}
                              {nftData?.name && (
                                 <Text mr={1} fontSize="sm">
                                    {nftData?.name}
                                 </Text>
                              )}
                              <IconExternalLink
                                 size="13"
                                 color="var(--chakra-colors-lightgray-900)"
                              />
                           </Flex>
                        </Button>
                     </RLink>
                  )}
               </Box>
            )}
         </MessageBox>
      </Flex>
   )
}

export default memo(ChatMessage)
