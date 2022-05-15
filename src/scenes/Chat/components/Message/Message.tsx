import { Box, Spinner } from '@chakra-ui/react'
import { IconCheck, IconChecks } from '@tabler/icons'
import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { formatMessageDate } from '../../../../helpers/date'
import { useIntersection } from '../../../../helpers/useIntersection'
import MessageUIType from '../../../../types/MessageUI'

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
   margin: var(--chakra-space-3) var(--chakra-space-4);
   margin-bottom: 0px;
   font-size: var(--chakra-fontSizes-md);
   clear: both;

   &:nth-last-child(1) {
      margin-bottom: 20px;
   }

   &.left {
      float: left;
      background: #fff;
   }
   &.right {
      float: right;
      background: var(--chakra-colors-darkgray-800);
      color: var(--chakra-colors-lightgray-100);
   }
   .timestamp {
      display: block;
      position: absolute;
      right: var(--chakra-space-7);
      bottom: var(--chakra-space-2);
      color: #aaa;
      font-size: var(--chakra-fontSizes-sm);
      user-select: none;
      line-height: 1.2;
   }
   .read-status {
      position: absolute;
      right: var(--chakra-space-2);
      bottom: var(--chakra-space-2);
      svg {
         stroke: var(--chakra-colors-lightgray-800);
      }
   }
   &.read {
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

const Message = ({
   account,
   msg,
   updateRead,
}: {
   account: string
   msg: MessageUIType
   updateRead: (data: MessageUIType) => void
}) => {
   const ref = useRef<HTMLHeadingElement>(null)
   const inViewport = useIntersection(ref, '0px')

   useEffect(() => {
      if (
         inViewport &&
         msg.read === false &&
         msg.toAddr.toLocaleLowerCase() === account.toLocaleLowerCase()
      ) {
         setMessageAsRead()
      }
   }, [inViewport])

   const setMessageAsRead = () => {
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
               console.log('✅ PUT Message:', data)
               updateRead(data)
            })
            .catch((error) => {
               console.error('🚨🚨REST API Error [PUT]:', error)
            })
      }
   }

   return (
      <MessageBox
         className={`msg ${msg.position} ${msg.read && 'read'}`}
         ref={ref}
      >
         <Box
            className="msg-img"
            style={{ backgroundImage: `url(${msg.img})` }}
         ></Box>
         <Box className="msg-bubble">
            {msg.message}
            <span className="timestamp">
               {formatMessageDate(new Date(msg.timestamp))}
            </span>

            <span className="read-status">
               {msg.isFetching ? (
                  <Spinner size="xs" />
               ) : msg.read ? (
                  <IconChecks size={15} />
               ) : (
                  <IconCheck size={15} />
               )}
            </span>
         </Box>
      </MessageBox>
   )
}

export default Message
