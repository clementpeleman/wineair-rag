'use client';

import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/supabase/functions/_lib/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FilesPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: documents, refetch: refetchDocuments } = useQuery(
    ['files'],
    async () => {
      const { data, error } = await supabase
        .from('documents_with_storage_path')
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to fetch documents',
        });
        throw error;
      }

      return data;
    }
  );

  useEffect(() => {
    refetchDocuments();
  }, [refetchDocuments]);

  const deleteDocument = useMutation(
    async (documentId: number) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['files']);
        router.refresh(); // Forceer een herladen van de pagina
        // console.log("success");
        toast({
          variant: 'default',
          description: 'Document deleted successfully',
        });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          description: 'Failed to delete document',
        });
        console.error(error);
      },
    }
  );

  return (
    <div className="max-w-6xl m-4 sm:m-10 flex flex-col gap-8 grow items-stretch">
      <div className="h-40 flex flex-col justify-center items-center border-b pb-8">
        <Input
          type="file"
          name="file"
          className="cursor-pointer w-full max-w-xs"
          onChange={async (e) => {
            const selectedFile = e.target.files?.[0];

            if (selectedFile) {
              const { error } = await supabase.storage
                .from('files')
                .upload(
                  `${crypto.randomUUID()}/${selectedFile.name}`,
                  selectedFile
                );

              if (error) {
                toast({
                  variant: 'destructive',
                  description:
                    'There was an error uploading the file. Please try again.',
                });
                return;
              }

              router.push('/chat');
            }
          }}
        />
      </div>
      {documents && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {documents?.map((document) => (
        <div
          key={document.id}
          className="flex flex-col gap-2 justify-center items-center border rounded-md p-4 sm:p-6 text-center overflow-hidden cursor-pointer hover:bg-slate-100 relative"
        >
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            onClick={() => deleteDocument.mutate(document.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
              <svg
                width="50px"
                height="50px"
                version="1.1"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m82 31.199c0.10156-0.60156-0.10156-1.1992-0.60156-1.6992l-24-24c-0.39844-0.39844-1-0.5-1.5977-0.5h-0.19922-31c-3.6016 0-6.6016 3-6.6016 6.6992v76.5c0 3.6992 3 6.6992 6.6016 6.6992h50.801c3.6992 0 6.6016-3 6.6016-6.6992l-0.003906-56.699v-0.30078zm-48-7.1992h10c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2h-10c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2zm32 52h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm-8-15v-17.199l17.199 17.199z" />
              </svg>

              {document.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
