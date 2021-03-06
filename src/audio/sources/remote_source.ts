import { AudioSource } from './audio_source';
import { SourceDescriptor } from './source_type';
import { WebrtcPeer } from '../../communication/wrtc_peer';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioDecodedStream } from '../../utils/audio/chunk_stream';

export class RemoteSource extends AudioSource {
  local: false = false;

  constructor(descriptor: SourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.channels = descriptor.channels;
  }

  patch(descriptor: Partial<SourceDescriptor>) {
    if (this.peer) {
      this.peer.sendControllerMessage({
        type: 'sourcePatch',
        source: {
          uuid: this.uuid,
          instanceUuid: this.instanceUuid,
          name: descriptor.name || this.name,
          latency: descriptor.latency || this.latency,
        },
      });
    }
  }

  _getAudioChunkStream = async () => {
    if (!this.peer) {
      throw new Error('Unknown peer');
    }
    if (!(this.peer instanceof WebrtcPeer)) {
      // this should never happens as a remote source should have a webrtc peer
      throw new Error('Peer of remote source is not a WebRTC Peer, this should never happen');
    }
    const stream = await this.peer.createAudioSourceChannel(this.uuid);
    const decodedStream = createAudioDecodedStream(this.channels);
    stream.pipe(decodedStream.input);
    this.log(`Created audio channel with source peer`);
    return decodedStream.output;
  }

  handleNoMoreReadingSink = () => {
    const peer = this.peer;
    if (peer) {
      if (!(peer instanceof WebrtcPeer)) {
        // this should never happens as a remote source should have a webrtc peer
        throw new Error('Peer of remote source is not a WebRTC Peer, this should never happen');
      }
      peer.closeAudioSourceChanel(this.uuid);
    }
    if (this.sourceStream) {
      this.sourceStream.end();
    }
    delete this.sourceStream;
    if (this.directSourceStream) {
      this.directSourceStream.end();
    }
    delete this.directSourceStream;
  }
}
