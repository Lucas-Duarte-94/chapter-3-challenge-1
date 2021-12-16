import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useMemo } from 'react';

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
  const router = useRouter();

  const estimatedTimeToRead = useMemo(() => {
    if (router.isFallback) {
      return 0;
    }
  
    const wordsPerMinute = 200;
  
    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;
  
        const bodyText = RichText.asText(currentContent.body);
        const bodyWords = bodyText.split(/\s/g).length;
  
        return summedContents + headingWords + bodyWords;
      },
      0
    );
  
    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);
  
    return readTime;
  }, [post, router.isFallback]);

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
          let body = RichText.asHtml(e.body)
          
          return (
            <div key={e.heading}>
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
    revalidate: 10
  }
};
