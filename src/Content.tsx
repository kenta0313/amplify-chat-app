import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { postListState, messageState, PostState } from "./recoil/ChatState";
import { API, graphqlOperation } from "aws-amplify";
import { GraphQLResult } from "@aws-amplify/api";
import { listPostsSortedByCreatedAt } from "./graphql/queries";
import { createPost, deletePost } from "./graphql/mutations";
import { onCreatePost } from "./graphql/subscriptions";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Chip from "@material-ui/core/Chip";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { CreatePostMutation, DeletePostMutation, ListPostsSortedByCreatedAtQuery } from "./API";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      paddingTop: theme.spacing(10),
      paddingBottom: theme.spacing(10),
      backgroundColor: "white",
    },
    input: {
      display: "flex",
    },
    myMessage: {
      display: "flex",
      justifyContent: "flex-start",
    },
    otherMessage: {
      display: "flex",
      justifyContent: "flex-end",
    },
  })
);

interface ContentProps {
  userName?: string;
  user?:string;
}

const Content = (props: ContentProps) => {
  const classes = useStyles();
  const [posts, setPosts] = useRecoilState(postListState);
  const [message, setMessage] = useRecoilState(messageState);

  const handleClick = () => {
    postPost();
  };

  const postPost = async () => {
    const post = (await API.graphql(
      graphqlOperation(createPost, {
        input: { message: message, owner: "chat", user: props.userName, create: "sample" },
      })
    )) as GraphQLResult<CreatePostMutation>;
    const postData = post.data?.createPost as PostState;
    setPosts([...posts, postData]);
    setMessage("");
  };

  const deletedPost = async (id: string) => {
      const input = { id }
      const post = (await API.graphql(
          graphqlOperation(deletePost, {
              input
          })
      )) as GraphQLResult<DeletePostMutation>;
      const postData = post?.data?.deletePost?.id;
      const updatedTodo = posts.filter(post => post.id !== postData);
      setPosts(updatedTodo);
  }

 
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  useEffect(() => {
    async function getPosts() {
      const res = (await API.graphql(
        graphqlOperation(listPostsSortedByCreatedAt, { owner: "chat" })
      )) as GraphQLResult<ListPostsSortedByCreatedAtQuery>;
      const postData = res?.data?.listPostsSortedByCreatedAt
        ?.items as PostState[];
      setPosts(postData);
    }
    getPosts();
  }, [setPosts]);

  useEffect(() => {
    // @ts-ignore
    const subscription = API.graphql(graphqlOperation(onCreatePost)).subscribe({
      next: (eventData: any) => {
        const post = eventData.value.data.onCreatePost;
        if (post !== undefined && post.user !== props.userName) {
          setPosts([...posts, post]);
        }
      },
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const postList: JSX.Element[] = [];

  for (const post of posts) {
    if (post.user === props.userName) {
      postList.push(
        <ListItem key={post.id} className={classes.myMessage}>
          <Chip label={post.message}></Chip>
            <p>{props.userName}</p>
            <button onClick={() => deletedPost(post.id)}>×</button>
        </ListItem>
      );
    } else {
      postList.push(
        <ListItem key={post.id} className={classes.otherMessage}>
          <Chip label={post.message}></Chip>
            <p>{post.user}</p>
        </ListItem>
      );
    }
  }

  return (
    <Container maxWidth="lg" className={classes.container}>
      <div className={classes.input}>
        <TextField value={message} onChange={handleChange} />
        <Button variant="contained" color="secondary" onClick={handleClick}>
          登録する
        </Button>
      </div>
      <List>{postList}</List>
    </Container>
  );
};

export default Content;
