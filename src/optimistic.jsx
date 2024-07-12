import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "./main";

const Optimistic = () => {
  const { isFetching, ...queryInfo } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/posts?_sort=id").then(
        (data) => data.json()
      );
      return response;
    },
  });

  console.log(queryInfo);
  // const { mutate, isError, isPending, variables } = useMutation({
  //     mutationFn: (newProduct) =>
  //         fetch('http://localhost:3000/posts', {
  //             method: 'POST',
  //             body: JSON.stringify(newProduct),
  //             headers: {
  //                 'content-type': 'Application/json',
  //             },
  //         }),
  //     onSuccess: async () => {
  //         return await queryClient.invalidateQueries({ queryKey: ['posts'] });
  //     },
  // });

  const { mutate } = useMutation({
    mutationFn: async (newPost) => {
      const response = await fetch("http://localhost:3000/posts", {
        method: "POST",
        body: JSON.stringify(newPost),
        headers: {
          "content-type": "Application/json",
        },
      });

      return await response.json();
    },

    //when mutate is called
    onMutate: async (newPost) => {
      // Cancel any outgoing refetch
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["posts"],
        queryFn: async () => {
          const response = await fetch(
            "http://localhost:3000/posts?_sort=id"
          ).then((data) => data.json());
          return response;
        },
      });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update to the new value
      if (previousPosts) {
        queryClient.setQueryData(
          ["posts"],
          (previousPosts) => [ ...previousPosts, newPost]
        );
      }

      return { previousPosts };
    },

    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const post = {
      id: Date.now(),
      title: e.target.elements.title.value,
    };
    mutate(post);
  };

  return (
    <>
      <div className="p-4 flex gap-12">
        <div className="flex-1">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <input
              className="border mb-4 p-2"
              type="text"
              placeholder="Title"
              name="title"
            />
            <button
              className="border mb-4 p-2 bg-purple-500 text-white"
              type="submit"
            >
              Submit
            </button>
          </form>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">Posts:</h2>
          {queryInfo.isPending && (
              <p className="border p-2 mb-4 opacity-40">
                Data is being fetched...
              </p>
            )}
          <ul>
            {queryInfo.isError && <p className="text-red-500">Something went wrong</p>}

            {queryInfo.data?.map((post) => {
              return (
                <li className="border p-2 mb-4" key={post.id}>
                  {post.title}
                </li>
              );
            })}
            
          </ul>
        </div>
      </div>
    </>
  );
};

export default Optimistic;
