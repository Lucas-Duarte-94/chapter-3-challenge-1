import { GetStaticProps } from 'next';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(props.postsPagination.results)
  }, [])

  function handleLoadMorePosts() {
    if (props.postsPagination.next_page) {
      fetch(props.postsPagination.next_page).then(res => res.json()).then(data => {
        
        props.postsPagination.next_page = data.next_page
        let newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        })
        setPosts([...posts, ...newPosts])})
    }
  }


  return (
    <div className={styles.container}>
      <Header />

      {posts.map(post => {
        return (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <div  className={styles.post_info}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.creation_info}>
                <span>
                  <img src="/images/calendar.svg" alt="calendario" />
                  <p>{format(
        new Date(post.first_publication_date), 
        'dd MMM yyyy', 
        {
          locale: ptBR
        })}</p>
                </span>
                <span>
                  <img src="/images/user.svg" alt="usuário" />
                  <p>{post.data.author}</p>
                </span>
              </div>
            </div>
          </Link>
        )
      })}

      
      {props.postsPagination.next_page &&
        
        <button onClick={handleLoadMorePosts}>Carregar mais posts</button>
      
      }

    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse: PostPagination = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['title', 'subtitle', 'author'],
    pageSize: 1,
  });

  
  const results = postsResponse.results.map<Post>(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })
  
  const props: HomeProps = {
    postsPagination: {
      next_page: postsResponse.next_page,
      results: results,
    }
  }

  return {
    props,
    revalidate: 60 * 30 // 30 Minutes
  }
};
