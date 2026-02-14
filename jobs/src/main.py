import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    logger.info("OpenHedgeFund job server starting...")
    while True:
        # TODO: Poll for jobs from Redis queue
        time.sleep(1)


if __name__ == "__main__":
    main()
