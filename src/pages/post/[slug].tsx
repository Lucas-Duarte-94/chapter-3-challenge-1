import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useEffect, useState } from 'react';
import { queryByTestId } from '@testing-library/dom';

interface PostProps {
  post: {
    first_publication_date: string | null;
    data: {
      title: string;
      banner: {
        url: string;
      };
      author: string;
      content: {
        heading: string;
        body: {
          text: string;
        }[];
      }[];
    };
  };
}


export default function Post({ post }: PostProps) {
  let id = 0;
  const [estimatedTimeToRead, setEstimatedTimeToRead] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let bodyText = '';
    let res = post.data.content.forEach(current => {
      bodyText += current.heading + " "

      current.body.forEach(element => {
        bodyText += element.text
      })

    })

    let Splitted = bodyText.split(' ');
    
    setEstimatedTimeToRead(Math.ceil(Splitted.length / 200))
  }, [])

  if (router.isFallback) {
    console.log('passou')
    return <div>Carregando...</div> 
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.img_place}>
        <img src={post.data.banner.url} alt="" />
      </div>
      <div className={styles.text_content}>
        <h1>{post.data.title}</h1>
        <div className={styles.creator_info}>
          <span>
            <FiCalendar />
            {format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR
              }
            )}
          </span>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock/>
            {estimatedTimeToRead} min
          </span>
        </div>

        {post.data.content.map(e => {
          id++;
          let body = RichText.asHtml(e.body)
          
          return (
            <div key={id}>
              <h2>{e.heading}</h2>
              <div dangerouslySetInnerHTML={{__html: body}}></div>
            </div>
          )
        })}

        

      </div>
      
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'post')
    );

  
  const paths = posts.results.map(e => {
    return {
      params: {
        slug: e.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
  
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(context.params.slug), {});

  
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map(element => {
        return {
          heading: element.heading,
          body: element.body.map(e => {
            return e
          })
        }
      })
    }
  }

  return {
    props: {
      post
    },
    revalidate: 1
  }
};
