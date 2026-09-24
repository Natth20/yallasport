import { ingestYoutubeClips } from '../src/lib/youtube/ingest';

ingestYoutubeClips()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
