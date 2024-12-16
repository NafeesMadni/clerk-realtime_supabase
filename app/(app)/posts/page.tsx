'use client'
import { supabaseClient } from "@/lib/supabase"
import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"

type Post = {
   id: number, 
   user_id: string,
   created_at: string,
   title: string,
}

export default  function() {
   const {getToken} = useAuth()
   const [posts, setPosts] = useState<Post[]>([]) 

   const getPosts = async () => {
      const token = await getToken({template: 'my_supabase'})
      const supabase = await supabaseClient(token)
      const {data} = await supabase
         .from('posts')
         .select('*')
      setPosts(data?? [])
   }

   useEffect(()=> {
      getPosts()
      const reload = async () => {
         const token = await getToken({template: 'my_supabase'})
         const supabase = await supabaseClient(token)
         const channel = supabase
            .channel('realtime_posts')
            .on('postgres_changes', {
               event: 'INSERT',
               schema: 'public',
               table: 'posts'
            }, (payload) => {
               console.log(payload)
               setPosts((posts: any) => [...posts, payload.new])
            }).subscribe();
         
         return () => {
            supabase.removeChannel(channel);
         }
      }
      reload()
   }, [supabaseClient])

   return  <pre>{JSON.stringify({ posts }, null, 2)}</pre>
}