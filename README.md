const filteredChats = response.chats.filter(chat => {
      return !chat.flag || chat.flag === false;
    })
